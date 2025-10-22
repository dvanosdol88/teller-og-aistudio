
import { initialAccountsData } from '../data/initialData';
import { Account, AccountId, AccountsData, Transaction } from '../types';
import { loadAccountsData, saveAccountsData } from './storageService';

// --- API IMPLEMENTATION (as per handoff document) ---

// Use the absolute backend URL to bypass local proxy issues and fix 404 errors.
const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE_URL = (envApiBaseUrl || '/api').replace(/\/$/, '');

/**
 * A robust map to translate backend account IDs (e.g., 'acc_llc_checking') 
 * to the frontend's internal AccountId keys (e.g., 'llcBank'). This is the
 * source of truth for linking API data to the UI.
 */
const BACKEND_ID_TO_ACCOUNT_ID_MAP: { [key: string]: AccountId } = {
    'acc_julie_personal': 'juliePersonalFinances',
    'acc_david_personal': 'davidPersonalFinances',
    'acc_llc_checking': 'llcBank',
    'acc_llc_savings': 'llcSavings',
    'acc_heloc_loan': 'helocLoan',
    'acc_member_loan_roof': 'memberLoan',
    'acc_mortgage_loan': 'mortgageLoan',
    'acc_property_asset': 'propertyAsset',
    'acc_rent_roll': 'rent'
    // Note: 'acc_llc_credit' from backend is not mapped as it doesn't have a corresponding UI component.
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
        try {
            // Try to parse a JSON error body, if available
            const errorBody = await response.json();
            errorMessage = errorBody.error || errorBody.message || errorMessage;
        } catch (e) { /* Ignore if response body isn't valid JSON */ }

        throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
}

interface BackendAccount {
    id: AccountId;
    name: string;
    subtitle: string;
    type: string;
    balance: number | null;
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

        const balancePromise = fetch(`${API_BASE_URL}/db/accounts/${accountId}/balances`)
            .then(handleApiResponse)
            .catch(err => {
                console.error(`Failed to fetch balance for ${accountId}:`, err);
                return null; // Return null on failure
            });
        
        const transactionsPromise = fetch(`${API_BASE_URL}/db/accounts/${accountId}/transactions?limit=100`)
            .then(handleApiResponse)
            .catch(err => {
                console.error(`Failed to fetch transactions for ${accountId}:`, err);
                return { transactions: [] }; // Return empty transactions on failure
            });

        const [balanceData, transactionsData] = await Promise.all([balancePromise, transactionsPromise]);
        
        const localAccountId = BACKEND_ID_TO_ACCOUNT_ID_MAP[baseAccount.id as string];

        if (!localAccountId) {
            console.warn(`Backend account ID "${baseAccount.id}" (name: "${baseAccount.name}") is not mapped to a frontend account and will be ignored.`);
            return [null, null];
        }
        
        // **FIX:** Isolate ONLY the live, non-editable data from the backend.
        // This prevents overwriting user-editable fields like 'name' or 'subtitle'.
        const liveBankData = {
            balance: balanceData?.balance ?? baseAccount.balance,
            transactions: (transactionsData?.transactions as Transaction[] ?? [])
        };
        
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
