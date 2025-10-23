
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Account, AccountId, AccountsData } from './types';
import { fetchAccountsData, saveAccountData } from './services/apiService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AiInsights from './components/AiInsights';
import Principles from './components/Principles';
import AccountModal from './components/modals/AccountModal';
import { initialAccountsData } from './data/initialData';
import ErrorBanner from './components/ErrorBanner';

const App: React.FC = () => {
    const [accountsData, setAccountsData] = useState<AccountsData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<AccountId | 'totalEquity' | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const loadData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
        try {
            setError(null);
            if (silent) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            const data = await fetchAccountsData();
            setAccountsData(data);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? `Failed to load live data: ${err.message}. Displaying cached data as a fallback.`
                : "An unknown error occurred while loading data. Displaying cached data as a fallback.";
            setError(errorMessage);
            setAccountsData(initialAccountsData); // Fallback to cached data on error
            console.error(err);
        } finally {
            if (silent) {
                setIsRefreshing(false);
            } else {
                setIsLoading(false);
            }
        }
    }, []);

    // Fetch data from the backend API when the component mounts.
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefreshLiveData = useCallback(async () => {
        await loadData({ silent: true });
    }, [loadData]);

    const calculateTotalEquity = useCallback(() => {
        if (!accountsData) return 0;
        
        // FIX: Cast Object.values to Account[] to prevent TypeScript from inferring 'unknown[]'.
        // This ensures 'acc' is correctly typed in subsequent array methods.
        const accounts = Object.values(accountsData) as Account[];

        const totalAssets = accounts
            .filter((acc: Account) => acc.type === 'asset' && acc.balance !== null)
            .reduce((sum, acc) => sum + (acc.balance ?? 0), 0);

        const totalLiabilities = accounts
            .filter((acc: Account) => acc.type === 'liability' && acc.balance !== null)
            .reduce((sum, acc) => sum + (acc.balance ?? 0), 0);
            
        return totalAssets - totalLiabilities;
    }, [accountsData]);

    const totalEquity = useMemo(() => calculateTotalEquity(), [accountsData, calculateTotalEquity]);

    const handleOpenModal = (accountId: AccountId | 'totalEquity') => {
        setSelectedAccountId(accountId);
    };

    const handleCloseModal = () => {
        setSelectedAccountId(null);
    };

    // Implemented the update handler to save data via the API service.
    const handleUpdateAccount = async (accountId: AccountId, updatedAccount: Account) => {
        if (!accountsData) return;
        try {
            const savedAccount = await saveAccountData(accountId, updatedAccount);
            setAccountsData(prevData => {
                if (!prevData) return null;
                return {
                    ...prevData,
                    [accountId]: savedAccount
                };
            });
        } catch (err) {
            console.error("Failed to save account data:", err);
            alert(`Error saving changes: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <div className="spinner w-12 h-12 mb-4 border-t-4 border-indigo-600"></div>
                    <p className="text-slate-600 font-semibold text-lg">Loading Financial Data...</p>
                </div>
            </div>
        );
    }
    
    return (
        <>
            <Header onRefreshLiveData={handleRefreshLiveData} isRefreshing={isRefreshing} />
            {accountsData && (
                 <main className="container mx-auto px-6 py-12">
                    {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
                    <section className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-800 mb-4">Interactive Financial Flow</h2>
                        <p className="max-w-3xl mx-auto text-lg text-slate-600">This dashboard visualizes the financial structure of your LLC. Click on any account to expand its details, view transactions, and see financing terms.</p>
                    </section>
                    
                    <Dashboard 
                        accountsData={accountsData} 
                        totalEquity={totalEquity}
                        onCardClick={handleOpenModal} 
                    />
                    
                    <AiInsights accountsData={accountsData} totalEquity={totalEquity} />
                    
                    <Principles />
                </main>
            )}
           
            {selectedAccountId && accountsData && (
                <AccountModal 
                    accountId={selectedAccountId}
                    accountsData={accountsData}
                    onClose={handleCloseModal}
                    onUpdate={handleUpdateAccount}
                    totalEquity={totalEquity}
                />
            )}
        </>
    );
};

export default App;
