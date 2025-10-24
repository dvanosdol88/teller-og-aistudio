import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBackendData } from '../apiService';

type MockResponseBody = Record<string, unknown> | null;

const mockJsonResponse = (body: MockResponseBody) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
        get: (key: string) => (key.toLowerCase() === 'content-type' ? 'application/json' : null)
    },
    json: async () => body
});

describe('fetchBackendData', () => {
    const originalNavigator = globalThis.navigator;

    beforeEach(() => {
        vi.restoreAllMocks();
        Object.defineProperty(globalThis, 'navigator', {
            value: { onLine: true },
            configurable: true
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        if (originalNavigator) {
            Object.defineProperty(globalThis, 'navigator', {
                value: originalNavigator,
                configurable: true
            });
        } else {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete (globalThis as Record<string, unknown>).navigator;
        }
    });

    it('places Teller TD Bank checking and savings accounts into LLC slots with live data', async () => {
        const tellerAccounts = [
            {
                id: 'tdbank-business-checking-123',
                name: 'Business Checking',
                type: 'depository',
                subtype: 'checking',
                provider: 'TD Bank',
                provider_account_id: 'tdbank-account-001',
                teller_account_id: 'teller-account-checking',
                balance: 0
            },
            {
                id: 'tdbank-business-savings-456',
                name: 'Business Savings',
                type: 'depository',
                subtype: 'savings',
                provider: 'TD Bank',
                provider_account_id: 'tdbank-account-002',
                teller_account_id: 'teller-account-savings',
                balance: 0
            }
        ];

        const checkingTransactions = [
            { date: '2024-06-01', description: 'Rent collection', debit: 3500, credit: 0 },
            { date: '2024-06-03', description: 'Mortgage payment', debit: 0, credit: 2500 }
        ];

        const savingsTransactions = [
            { date: '2024-06-02', description: 'Transfer from checking', debit: 0, credit: 1500 }
        ];

        const responseQueue = [
            mockJsonResponse({ accounts: tellerAccounts }),
            mockJsonResponse({ balance: 43210.55 }),
            mockJsonResponse({ transactions: checkingTransactions }),
            mockJsonResponse({ balance: 9876.54 }),
            mockJsonResponse({ transactions: savingsTransactions })
        ];
        const expectedCalls = responseQueue.length;

        const fetchMock = vi
            .fn()
            .mockImplementation(() => {
                const next = responseQueue.shift();
                if (!next) {
                    throw new Error('Unexpected fetch invocation in test');
                }
                return Promise.resolve(next);
            });

        vi.stubGlobal('fetch', fetchMock);

        const backendData = await fetchBackendData();

        expect(fetchMock).toHaveBeenCalledTimes(expectedCalls);
        expect(backendData.llcBank).toBeDefined();
        expect(backendData.llcSavings).toBeDefined();
        expect(backendData.llcBank?.balance).toBe(43210.55);
        expect(backendData.llcBank?.transactions).toEqual(checkingTransactions);
        expect(backendData.llcSavings?.balance).toBe(9876.54);
        expect(backendData.llcSavings?.transactions).toEqual(savingsTransactions);
    });
});
