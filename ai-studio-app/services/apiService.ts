
import { initialAccountsData } from '../data/initialData';
import { Account, AccountId, AccountsData, Transaction } from '../types';
import { loadAccountsData, saveAccountsData } from './storageService';

class ApiError extends Error {
    status: number;
    details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

// --- API IMPLEMENTATION (as per handoff document) ---

// Use the absolute backend URL to bypass local proxy issues and fix 404 errors.
const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE_URL = (envApiBaseUrl || '/api').replace(/\/$/, '');

/**
 * Normalises a string key for comparison (trim + lowercase).
 */
const normalizeKey = (value: string | null | undefined) =>
    (value ?? '').trim().toLowerCase();

/**
 * Optionally supplied mapping from backend account IDs to the app's AccountId keys.
 * The value is expected to be JSON where keys are backend IDs and values are AccountIds.
 */
const envBackendIdMapRaw = (import.meta.env.VITE_BACKEND_ACCOUNT_ID_MAP || '').trim();

let ENV_BACKEND_ID_TO_ACCOUNT_ID_MAP: Partial<Record<string, AccountId>> = {};
if (envBackendIdMapRaw) {
    try {
        const parsed = JSON.parse(envBackendIdMapRaw);
        if (typeof parsed === 'object' && parsed !== null) {
            ENV_BACKEND_ID_TO_ACCOUNT_ID_MAP = Object.entries(parsed).reduce(
                (acc, [backendId, accountId]) => {
                    if (typeof backendId === 'string' && typeof accountId === 'string') {
                        acc[backendId] = accountId as AccountId;
                    }
                    return acc;
                },
                {} as Partial<Record<string, AccountId>>
            );
        }
    } catch (error) {
        console.warn('VITE_BACKEND_ACCOUNT_ID_MAP is not valid JSON. Ignoring the environment override.', error);
    }
}

/**
 * A robust map to translate backend account IDs (e.g., 'acc_llc_checking')
 * to the frontend's internal AccountId keys (e.g., 'llcBank'). This is the
 * source of truth for linking API data to the UI.
 */
const DEFAULT_BACKEND_ID_TO_ACCOUNT_ID_MAP: Partial<Record<string, AccountId>> = {
    // Legacy demo identifiers retained for offline mode and historical data sets
    'acc_julie_personal': 'juliePersonalFinances',
    'acc_david_personal': 'davidPersonalFinances',
    'acc_llc_checking': 'llcBank',
    'acc_llc_operating': 'llcBank',
    'acc_llc_savings': 'llcSavings',
    'acc_llc_reserve': 'llcSavings',
    'acc_heloc_loan': 'helocLoan',
    'acc_member_loan_roof': 'memberLoan',
    'acc_mortgage_loan': 'mortgageLoan',
    'acc_property_asset': 'propertyAsset',
    'acc_property_tax': 'llcSavings',
    'acc_rent_roll': 'rent'
};

const BACKEND_ID_TO_ACCOUNT_ID_MAP: Partial<Record<string, AccountId>> = {
    ...DEFAULT_BACKEND_ID_TO_ACCOUNT_ID_MAP,
    ...ENV_BACKEND_ID_TO_ACCOUNT_ID_MAP
};

const STATIC_DATASET_ACCOUNT_IDS = new Set<string>([
    'acc_julie_personal',
    'acc_david_personal',
    'acc_llc_checking',
    'acc_llc_operating',
    'acc_llc_savings',
    'acc_llc_reserve',
    'acc_llc_credit',
    'acc_heloc_loan',
    'acc_member_loan_roof',
    'acc_mortgage_loan',
    'acc_property_asset',
    'acc_property_tax',
    'acc_rent_roll'
]);

const BACKEND_NAME_TO_ACCOUNT_ID_MAP: Partial<Record<string, AccountId>> = {
    'julie personal finances': 'juliePersonalFinances',
    'david personal finances': 'davidPersonalFinances',
    'llc operating checking': 'llcBank',
    'llc reserve savings': 'llcSavings',
    'llc savings': 'llcSavings',
    'heloc loan': 'helocLoan',
    'member loan (roof)': 'memberLoan',
    'member loan roof': 'memberLoan',
    '672 elm st. mortgage': 'mortgageLoan',
    '672 elm st mortgage': 'mortgageLoan',
    '672 elm st': 'propertyAsset',
    'rent roll': 'rent'
};

const BACKEND_LAST4_TO_ACCOUNT_ID_MAP: Partial<Record<string, AccountId>> = {
    '7123': 'llcBank',
    '0441': 'llcSavings',
    '8899': 'helocLoan',
    '3001': 'propertyAsset'
};

/**
 * Resolves the UI AccountId for a backend account by checking:
 *   1. Direct ID mappings (env override wins)
 *   2. Account name heuristics
 *   3. Last four digits of the account number
 */
const resolveAccountId = (baseAccount: BackendAccount): AccountId | null => {
    const directMatch = BACKEND_ID_TO_ACCOUNT_ID_MAP[baseAccount.id];
    if (directMatch) {
        return directMatch;
    }

    const nameMatch = BACKEND_NAME_TO_ACCOUNT_ID_MAP[normalizeKey(baseAccount.name)];
    if (nameMatch) {
        return nameMatch;
    }

    const lastFourMatch = BACKEND_LAST4_TO_ACCOUNT_ID_MAP[normalizeKey(baseAccount.last_four)];
    if (lastFourMatch) {
        return lastFourMatch;
    }

    return null;
};


/**
 * Checks if the browser is currently online.
 * Throws an error if offline to prevent failed network requests.
 */
async function checkOnlineStatus() {
    if (!navigator.onLine) {
        throw new Error("You appear to be offline. Please check your internet connection.");
    }
}

/**
 * A helper function to process API responses, handling errors and JSON parsing.
 * @param response The raw Response object from a fetch call.
 * @returns A promise that resolves with the parsed JSON body.
 */
async function handleApiResponse(response: Response) {
    if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        let errorDetails: unknown = null;
        try {
            // Try to parse a JSON error body, if available
            const errorBody = await response.json();
            errorDetails = errorBody;
            errorMessage = errorBody.error || errorBody.message || errorMessage;
        } catch (e) { /* Ignore if response body isn't valid JSON */ }

        throw new ApiError(errorMessage, response.status, errorDetails);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
}

interface BackendAccount {
    id: string;
    name?: string;
    subtitle?: string;
    type?: string;
    balance?: number | null;
    last_four?: string | null;
    provider?: string | null;
    provider_account_id?: string | null;
    teller_account_id?: string | null;
    account_id?: string | null;
    [key: string]: unknown;
}

/**
 * Fetches the latest read-only data (balances and transactions) from the backend.
 * @returns A promise that resolves to a partial AccountsData object containing only live bank data.
 */
const fetchBackendData = async (): Promise<Partial<AccountsData>> => {
    await checkOnlineStatus();
    console.log(`API CALL: Fetching all accounts from GET ${API_BASE_URL}/db/accounts...`);
    
    const accountsResponse = await fetch(`${API_BASE_URL}/db/accounts`);
    const { accounts: baseAccounts } = await handleApiResponse(accountsResponse);

    const accountPromises = (baseAccounts as BackendAccount[]).map(async (baseAccount) => {
        const accountId = baseAccount.id;
        const isStaticDatasetAccount = STATIC_DATASET_ACCOUNT_IDS.has(accountId);

        const balancePromise = fetch(`${API_BASE_URL}/db/accounts/${accountId}/balances`)
            .then(handleApiResponse)
            .catch(err => {
                if (err instanceof ApiError && err.status === 404 && isStaticDatasetAccount) {
                    console.info(`Balances endpoint missing for demo dataset account ${accountId}; continuing with cached data.`);
                } else {
                    console.error(`Failed to fetch balance for ${accountId}:`, err);
                }
                return null; // Return null on failure
            });

        const transactionsPromise = fetch(`${API_BASE_URL}/db/accounts/${accountId}/transactions?limit=100`)
            .then(handleApiResponse)
            .catch(err => {
                if (err instanceof ApiError && err.status === 404) {
                    if (isStaticDatasetAccount) {
                        console.info(`Transactions endpoint missing for demo dataset account ${accountId}; skipping.`);
                    } else {
                        console.warn(`Transactions endpoint returned 404 for ${accountId}.`, err.details ?? err.message);
                    }
                } else {
                    console.error(`Failed to fetch transactions for ${accountId}:`, err);
                }
                return { transactions: [] }; // Return empty transactions on failure
            });

        const [balanceData, transactionsData] = await Promise.all([balancePromise, transactionsPromise]);

        const localAccountId = resolveAccountId(baseAccount as BackendAccount);

        if (!localAccountId) {
            console.warn(
                `Backend account ID "${baseAccount.id}" (name: "${baseAccount.name}") could not be mapped to a frontend account via ID, name, or last_four. Set VITE_BACKEND_ACCOUNT_ID_MAP if you need to link it.`
            );
            return [null, null];
        }

        // **FIX:** Isolate ONLY the live, non-editable data from the backend.
        // This prevents overwriting user-editable fields like 'name' or 'subtitle'.
        const liveBankData = {
            balance: balanceData?.balance ?? baseAccount.balance,
            transactions: (transactionsData?.transactions as Transaction[] ?? [])
        };

        const tellerAccountId = [
            baseAccount.teller_account_id,
            baseAccount.provider_account_id,
            baseAccount.account_id
        ].find((value) => typeof value === 'string' && value.trim());

        const logPayload: Record<string, unknown> = {
            backend_account_id: accountId,
            mapped_account_id: localAccountId,
            transaction_count: liveBankData.transactions.length,
            last_four: baseAccount.last_four ?? null,
        };

        if (tellerAccountId) {
            logPayload.teller_account_id = tellerAccountId;
        }

        if (isStaticDatasetAccount) {
            logPayload.source = baseAccount.provider ?? 'demo-dataset';
            console.log('API CALL: Using static dashboard dataset account', logPayload);
        } else {
            logPayload.provider = baseAccount.provider ?? 'teller';
            console.log('API CALL: Received Teller account payload', logPayload);
        }

        return [localAccountId, liveBankData];
    });

    const accountEntries = (await Promise.all(accountPromises)).filter(([id]) => id !== null);
    const backendData = Object.fromEntries(accountEntries);
    
    console.log("API CALL: Successfully fetched and composed all backend account data.", backendData);
    return backendData;
};

/**
 * Fetches all account data by orchestrating backend calls and local storage.
 * It merges fresh, read-only data from the backend with user-editable data from local storage.
 */
export const fetchAccountsData = async (): Promise<AccountsData> => {
    const backendData = await fetchBackendData();
    const localData = loadAccountsData();

    // First time run: seed local storage with a merge of initial template and backend data.
    if (!localData) {
        const seededData = { ...initialAccountsData };
        for (const accountId in backendData) {
            if (seededData[accountId as AccountId]) {
                 // **FIX:** Merge live bank data into the initial template.
                seededData[accountId as AccountId] = {
                    ...seededData[accountId as AccountId],
                    ...(backendData[accountId as AccountId] as any),
                };
            }
        }
        console.log("First time run: Seeding local storage with initial data.", seededData);
        saveAccountsData(seededData);
        return seededData;
    }

    // Subsequent runs: merge local data with fresh backend data.
    const mergedData = { ...localData };
    for (const accountId in backendData) {
        if (mergedData[accountId as AccountId]) {
            // **FIX:** Merge live bank data into the user's saved local data.
            // This preserves user edits to fields like 'name' while updating financial numbers.
            mergedData[accountId as AccountId] = {
                ...mergedData[accountId as AccountId],
                ...(backendData[accountId as AccountId] as any),
            };
        }
    }
    
    console.log("Merging local and backend data.", mergedData);
    saveAccountsData(mergedData); // Persist the latest merged view
    return mergedData;
};

/**
 * Saves an updated account object to local storage.
 * This function handles persistence for all user-editable data.
 * @param accountId The ID of the account to update.
 * @param updatedAccount The new account object.
 * @returns A promise that resolves with the saved account data.
 */
export const saveAccountData = async (accountId: AccountId, updatedAccount: Account): Promise<Account> => {
    console.log(`LOCAL SAVE: Saving data for ${accountId}...`);
    const currentData = loadAccountsData();
    if (!currentData) {
        throw new Error("Cannot save, no local data found. This should not happen.");
    }
    const newData: AccountsData = {
        ...currentData,
        [accountId]: updatedAccount,
    };
    saveAccountsData(newData);
    console.log(`LOCAL SAVE: Save successful for ${accountId}.`);
    return updatedAccount;
};
