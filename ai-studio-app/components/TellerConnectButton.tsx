import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isTellerConfigured, openTellerConnect, prepareTellerConnect, TellerEnrollment } from '../services/tellerConnect';

interface TellerConnectButtonProps {
    onConnected?: () => Promise<void> | void;
    disabled?: boolean;
}

const STORAGE_KEY = 'teller:enrollment';

const TellerConnectButton: React.FC<TellerConnectButtonProps> = ({ onConnected, disabled }) => {
    const [isReady, setIsReady] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isConfigured = useMemo(() => isTellerConfigured(), []);

    useEffect(() => {
        let isMounted = true;
        if (!isConfigured) {
            setStatusMessage(null);
            setErrorMessage(null);
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

    const persistEnrollment = (enrollment: TellerEnrollment) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(enrollment));
        } catch (error) {
            console.warn('Unable to persist Teller enrollment locally', error);
        }
    };

    const postEnrollmentToBackend = async (enrollment: TellerEnrollment) => {
        if (!enrollment?.accessToken) {
            console.warn('Enrollment missing access token; skipping backend submission.');
            return;
        }
        try {
            const response = await fetch('/api/enrollments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${enrollment.accessToken}`
                },
                body: JSON.stringify({ enrollment })
            });

            if (!response.ok) {
                const message = await response.text();
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
                    const tellerActivityLog = {
                        enrollment_id: enrollment.enrollmentId ?? null,
                        account_ids: Array.isArray((enrollment as any)?.accounts)
                            ? (enrollment as any).accounts
                                  .map((account: any) => account?.id || account?.account_id)
                                  .filter(Boolean)
                            : undefined,
                        token_preview: enrollment.accessToken
                            ? `${enrollment.accessToken.slice(0, 6)}…`
                            : null,
                    };
                    console.log('[TellerConnect] Enrollment received', tellerActivityLog);
                    setStatusMessage('Connection successful. Syncing latest balances...');
                    persistEnrollment(enrollment);
                    await postEnrollmentToBackend(enrollment);

                    try {
                        await onConnected?.();
                        setStatusMessage('Latest balances synced.');
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
                <span className="text-xs text-slate-600">{statusMessage}</span>
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
