import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isTellerConfigured, openTellerConnect, prepareTellerConnect, TellerEnrollment } from '../services/tellerConnect';

interface TellerConnectButtonProps {
    onConnected?: () => Promise<void> | void;
    disabled?: boolean;
}

const STORAGE_KEY = 'teller:enrollment';

type StoredTellerEnrollment = TellerEnrollment & { _storedAt: string };

interface EnrollmentSummary {
    enrollmentId: string | null;
    userId: string | null;
    accountIds: string[];
    tokenPreview: string | null;
    institution: string | null;
    storedAt: string | null;
}

const toNonEmptyString = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const sanitizeTokenPreview = (token: string | null | undefined): string | null => {
    if (!token) {
        return null;
    }
    const trimmed = token.trim();
    if (!trimmed) {
        return null;
    }
    if (trimmed.length <= 10) {
        return trimmed;
    }
    return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
};

const extractAccountIds = (candidate: unknown): string[] => {
    if (!Array.isArray(candidate)) {
        return [];
    }

    return candidate
        .map((entry) => {
            if (typeof entry === 'string') {
                return toNonEmptyString(entry);
            }
            if (entry && typeof entry === 'object') {
                const record = entry as Record<string, unknown>;
                return (
                    toNonEmptyString(record.id) ||
                    toNonEmptyString(record.account_id) ||
                    toNonEmptyString(record.accountId)
                );
            }
            return null;
        })
        .filter((value): value is string => Boolean(value));
};

const buildEnrollmentSummary = (
    enrollment: (TellerEnrollment | StoredTellerEnrollment | null | undefined)
): EnrollmentSummary | null => {
    if (!enrollment || typeof enrollment !== 'object') {
        return null;
    }

    const record = enrollment as Record<string, unknown>;

    const rawAccessToken = toNonEmptyString((record.accessToken ?? record.access_token) as string | undefined);
    const enrollmentId = toNonEmptyString((record.enrollmentId ?? record.enrollment_id) as string | undefined);
    let userId = toNonEmptyString((record.userId ?? record.user_id) as string | undefined);
    if (!userId) {
        const user = record.user;
        if (user && typeof user === 'object') {
            const userRecord = user as Record<string, unknown>;
            userId = toNonEmptyString((userRecord.id ?? userRecord.user_id) as string | undefined);
        }
    }

    const institution = toNonEmptyString(record.institution as string | undefined);
    const accountIds = Array.from(
        new Set([
            ...extractAccountIds(record.accounts),
            ...extractAccountIds(record.account_ids),
            ...extractAccountIds(record.accountIds)
        ])
    );

    const storedAt = toNonEmptyString((record._storedAt ?? record.storedAt) as string | undefined);

    return {
        enrollmentId: enrollmentId ?? null,
        userId: userId ?? null,
        accountIds,
        tokenPreview: sanitizeTokenPreview(rawAccessToken),
        institution: institution ?? null,
        storedAt: storedAt ?? null,
    };
};

const formatTimestamp = (isoString: string | null): string | null => {
    if (!isoString) {
        return null;
    }

    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
        return isoString;
    }

    return date.toLocaleString();
};

const TellerConnectButton: React.FC<TellerConnectButtonProps> = ({ onConnected, disabled }) => {
    const [isReady, setIsReady] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [latestEnrollmentSummary, setLatestEnrollmentSummary] = useState<EnrollmentSummary | null>(null);

    const isConfigured = useMemo(() => isTellerConfigured(), []);

    useEffect(() => {
        let isMounted = true;
        if (!isConfigured) {
            setStatusMessage(null);
            setErrorMessage(null);
            setLatestEnrollmentSummary(null);
            return () => {
                isMounted = false;
            };
        }

        prepareTellerConnect()
            .then(() => {
                if (isMounted) {
                    setIsReady(true);
                }
            })
            .catch((error) => {
                if (isMounted) {
                    setErrorMessage(error instanceof Error ? error.message : 'Failed to load Teller Connect.');
                }
            });

        return () => {
            isMounted = false;
        };
    }, [isConfigured]);

    useEffect(() => {
        if (!isConfigured || typeof window === 'undefined') {
            return;
        }

        let isMounted = true;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                if (isMounted) {
                    setLatestEnrollmentSummary(null);
                }
            } else {
                const parsed = JSON.parse(raw) as TellerEnrollment | StoredTellerEnrollment;
                const summary = buildEnrollmentSummary(parsed);
                if (isMounted) {
                    setLatestEnrollmentSummary(summary);
                    if (summary) {
                        setStatusMessage((previous) => previous ?? 'Latest balances synced (cached from previous Teller session).');
                    }
                }
            }
        } catch (error) {
            console.warn('Unable to read Teller enrollment from local storage', error);
        }

        return () => {
            isMounted = false;
        };
    }, [isConfigured]);

    const persistEnrollment = (enrollment: TellerEnrollment): StoredTellerEnrollment | null => {
        try {
            const storedEnrollment: StoredTellerEnrollment = {
                ...enrollment,
                _storedAt: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storedEnrollment));
            return storedEnrollment;
        } catch (error) {
            console.warn('Unable to persist Teller enrollment locally', error);
            return null;
        }
    };

    const postEnrollmentToBackend = async (enrollment: TellerEnrollment) => {
        const accessToken =
            toNonEmptyString(enrollment?.accessToken) ||
            toNonEmptyString((enrollment as any)?.access_token as string | undefined);

        if (!accessToken) {
            console.warn('Enrollment missing access token; skipping backend submission.');
            return;
        }
        try {
            const response = await fetch('/api/enrollments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ enrollment })
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.info('Backend does not expose POST /api/enrollments; skipping server enrollment hand-off.');
                    return;
                }

                let message: string | undefined;
                try {
                    message = await response.text();
                } catch (readError) {
                    message = response.statusText;
                }
                console.warn('Backend enrollment submission failed', response.status, message);
            }
        } catch (error) {
            console.warn('Failed to submit enrollment to backend', error);
        }
    };

    const handleConnect = useCallback(async () => {
        if (!isConfigured) return;
        setIsLaunching(true);
        setErrorMessage(null);
        setStatusMessage('Launching Teller Connect...');

        try {
            await openTellerConnect({
                onSuccess: async (enrollment) => {
                    const storedEnrollment = persistEnrollment(enrollment) ?? enrollment;
                    const summary = buildEnrollmentSummary(storedEnrollment);

                    if (summary) {
                        setLatestEnrollmentSummary(summary);
                        const activityLog: Record<string, unknown> = {
                            enrollment_id: summary.enrollmentId,
                            user_id: summary.userId,
                            account_ids: summary.accountIds.length ? summary.accountIds : undefined,
                            account_count: summary.accountIds.length,
                            token_preview: summary.tokenPreview,
                            institution: summary.institution ?? undefined,
                            stored_at: summary.storedAt ?? undefined,
                        };
                        console.log('[TellerConnect] Enrollment received', activityLog);
                    } else {
                        setLatestEnrollmentSummary(null);
                        const fallbackLog = {
                            enrollment_id:
                                toNonEmptyString((enrollment as any)?.enrollmentId) ||
                                toNonEmptyString((enrollment as any)?.enrollment_id),
                            token_preview: sanitizeTokenPreview(
                                toNonEmptyString(enrollment?.accessToken) ||
                                toNonEmptyString((enrollment as any)?.access_token as string | undefined)
                            ),
                        };
                        console.log('[TellerConnect] Enrollment received (partial)', fallbackLog);
                    }

                    setStatusMessage('Connection successful. Syncing latest balances...');
                    await postEnrollmentToBackend(enrollment);

                    try {
                        await onConnected?.();
                        setStatusMessage('Latest balances synced. Teller enrollment details below.');
                    } catch (refreshError) {
                        console.error('Failed to refresh data after Teller Connect', refreshError);
                        setErrorMessage(refreshError instanceof Error ? refreshError.message : 'Failed to refresh data.');
                    } finally {
                        setIsLaunching(false);
                    }
                },
                onExit: () => {
                    setIsLaunching(false);
                    setStatusMessage(null);
                },
                onFailure: (error) => {
                    setIsLaunching(false);
                    setErrorMessage(error.message || 'Failed to launch Teller Connect.');
                }
            });
        } catch (error) {
            setIsLaunching(false);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to launch Teller Connect.');
        }
    }, [isConfigured, onConnected]);

    const buttonDisabled = disabled || !isReady || !isConfigured || isLaunching;
    const formattedStoredAt = formatTimestamp(latestEnrollmentSummary?.storedAt ?? null);
    const accountIdsDisplay = latestEnrollmentSummary?.accountIds?.length
        ? latestEnrollmentSummary.accountIds.join(', ')
        : '—';

    return (
        <div className="flex flex-col items-end space-y-1">
            <button
                type="button"
                onClick={handleConnect}
                disabled={buttonDisabled}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${buttonDisabled ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
                {isLaunching ? 'Connecting…' : 'Link Bank Accounts'}
            </button>
            {statusMessage && !errorMessage && (
                <div className="text-xs text-slate-600 text-right max-w-xs">{statusMessage}</div>
            )}
            {latestEnrollmentSummary && (
                <div className="text-[11px] leading-tight text-slate-500 text-right max-w-xs space-y-1">
                    <div className="uppercase tracking-wide font-semibold text-slate-400">Latest Teller enrollment</div>
                    <dl className="space-y-0.5">
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-500">Enrollment ID</dt>
                            <dd className="font-mono text-slate-700">{latestEnrollmentSummary.enrollmentId ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-500">User ID</dt>
                            <dd className="font-mono text-slate-700">{latestEnrollmentSummary.userId ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-500">Account IDs</dt>
                            <dd className="font-mono text-slate-700 break-all">{accountIdsDisplay}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-500">Token</dt>
                            <dd className="font-mono text-slate-700">{latestEnrollmentSummary.tokenPreview ?? '—'}</dd>
                        </div>
                        {formattedStoredAt && (
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-500">Synced</dt>
                                <dd className="font-mono text-slate-700">{formattedStoredAt}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            )}
            {errorMessage && (
                <span className="text-xs text-red-600 max-w-xs text-right">{errorMessage}</span>
            )}
            {!isConfigured && !errorMessage && (
                <span className="text-xs text-slate-500">Set VITE_TELLER_APPLICATION_ID to enable Teller Connect.</span>
            )}
        </div>
    );
};

export default TellerConnectButton;
