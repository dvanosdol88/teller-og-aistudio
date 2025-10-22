import React, { useState, useEffect } from 'react';
import { Account, AccountId, AssetAccount, LiabilityAccount, PersonalAccount, FinancingTerms } from '../../types';
import TransactionsTab from './tabs/TransactionsTab';
import FinancingTermsTab from './tabs/FinancingTermsTab';
import AmortizationTab from './tabs/AmortizationTab';

type GeneralAccount = PersonalAccount | AssetAccount | LiabilityAccount;

interface GeneralAccountContentProps {
    accountId: AccountId;
    account: GeneralAccount;
    onSave: (updatedAccount: Account) => Promise<void>;
    onClose: () => void;
}

const GeneralAccountContent: React.FC<GeneralAccountContentProps> = ({ account, onSave, onClose }) => {
    const availableTabs = ['Transactions'];
    if (account.type === 'liability' && account.financingTerms) {
        availableTabs.push('Financing Terms', 'Amortization');
    }

    const [activeTab, setActiveTab] = useState(availableTabs[0]);
    const [editedAccount, setEditedAccount] = useState<GeneralAccount>(account);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setEditedAccount(account);
    }, [account]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedAccount(prev => ({ ...prev, [name]: value }));
    };

    const handleTermsChange = (updatedTerms: FinancingTerms) => {
        setEditedAccount(prev => {
            if ('financingTerms' in prev) {
                return { ...prev, financingTerms: updatedTerms };
            }
            return prev;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Smart save: Start with the latest props from the backend (fresh balance/transactions)
        const finalAccount = { ...account };
        
        // Layer on the user's edits for editable fields
        finalAccount.name = editedAccount.name;
        finalAccount.subtitle = editedAccount.subtitle;
        if ('financingTerms' in finalAccount && 'financingTerms' in editedAccount) {
            finalAccount.financingTerms = editedAccount.financingTerms;
        }

        await onSave(finalAccount);
        // The modal will close via the onSave prop which calls handleClose in the parent.
    };

    return (
        <>
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
                <div className="flex-grow pr-4">
                    <input 
                        type="text"
                        name="name"
                        value={editedAccount.name}
                        onChange={handleInputChange}
                        className="text-2xl font-bold text-slate-800 w-full border-b-2 border-transparent focus:border-indigo-600 outline-none"
                        aria-label="Account Name"
                    />
                    <input 
                        type="text"
                        name="subtitle"
                        value={editedAccount.subtitle}
                        onChange={handleInputChange}
                        className="text-sm text-slate-500 w-full border-b-2 border-transparent focus:border-indigo-600 outline-none"
                        aria-label="Account Subtitle"
                    />
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
            </div>
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="border-b border-slate-200 mb-6">
                    {availableTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab text-sm font-semibold p-4 border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div>
                    {activeTab === 'Transactions' && 'transactions' in account && (
                        <TransactionsTab 
                            transactions={account.transactions} // Always show fresh, read-only transactions
                        />
                    )}
                    {activeTab === 'Financing Terms' && 'financingTerms' in editedAccount && editedAccount.financingTerms && (
                        <FinancingTermsTab 
                            terms={editedAccount.financingTerms}
                            onTermsChange={handleTermsChange} 
                        />
                    )}
                    {activeTab === 'Amortization' && 'financingTerms' in account && account.financingTerms && (
                        <AmortizationTab terms={account.financingTerms} />
                    )}
                </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
                <div className="flex justify-end items-center">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed w-32 text-center"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default GeneralAccountContent;