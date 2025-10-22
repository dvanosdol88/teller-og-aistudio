
import { AccountsData } from '../types';

const LOCAL_STORAGE_KEY = 'llcFinancialData';

/**
 * Saves the entire AccountsData object to the browser's localStorage.
 * @param data The account data object to save.
 */
export const saveAccountsData = (data: AccountsData): void => {
    try {
        const serializedData = JSON.stringify(data);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedData);
    } catch (error) {
        console.error("Failed to save data to localStorage:", error);
    }
};

/**
 * Loads the AccountsData object from the browser's localStorage.
 * @returns The parsed AccountsData object, or null if no data is found or if parsing fails.
 */
export const loadAccountsData = (): AccountsData | null => {
    try {
        const serializedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (serializedData === null) {
            return null;
        }
        return JSON.parse(serializedData);
    } catch (error) {
        console.error("Failed to load data from localStorage:", error);
        return null;
    }
};
