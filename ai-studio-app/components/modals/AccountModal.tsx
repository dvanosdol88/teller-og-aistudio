
import React, { useState, useEffect, useCallback } from 'react';
import { Account, AccountId, AccountsData, PersonalAccount, AssetAccount, LiabilityAccount, RevenueAccount } from '../../types';
import GeneralAccountContent from './GeneralAccountContent';
import RentRollContent from './RentRollContent';
import EquityContent from './EquityContent';

interface AccountModalProps {
    accountId: AccountId | 'totalEquity';
    accountsData: AccountsData;
    onClose: () => void;
    onUpdate: (accountId: AccountId, updatedAccount: Account) => Promise<void>;
    totalEquity: number;
}

const AccountModal: React.FC<AccountModalProps> = ({ accountId, accountsData, onClose, onUpdate, totalEquity }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    }, [onClose]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose]);

    const account = accountId !== 'totalEquity' ? accountsData[accountId] : null;

    const renderContent = () => {
        if (accountId === 'totalEquity') {
            const accounts = Object.values(accountsData) as Account[];
            const totalAssets = accounts.filter((acc: Account) => acc.type === 'asset').reduce((sum, acc) => sum + (acc.balance ?? 0), 0);
            const totalLiabilities = accounts.filter((acc: Account) => acc.type === 'liability').reduce((sum, acc) => sum + (acc.balance ?? 0), 0);
            return (
                <>
                    <div className="flex items-start justify-between p-6 border-b border-slate-200">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800">Owner's Equity Calculation</h3>
                            <p className="text-sm text-slate-500">A snapshot of the LLC's net worth.</p>
                        </div>
                        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
                    </div>
                    <EquityContent totalAssets={totalAssets} totalLiabilities={totalLiabilities} totalEquity={totalEquity} />
                </>
            );
        }

        if (!account) return null;

        if (account.type === 'revenue') {
             return <RentRollContent 
                        account={account as RevenueAccount} 
                        onClose={handleClose}
                        onSave={async (updatedAccount) => {
                            await onUpdate(accountId, updatedAccount);
                            handleClose();
                        }} 
                    />;
        }

        return <GeneralAccountContent 
                    account={account as PersonalAccount | AssetAccount | LiabilityAccount}
                    accountId={accountId}
                    onClose={handleClose} 
                    onSave={async (updatedAccount) => {
                        await onUpdate(accountId, updatedAccount);
                        handleClose();
                    }}
                />;
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className={`fixed inset-0 bg-black transition-opacity duration-300 ${isClosing ? 'bg-opacity-0' : 'bg-opacity-50'}`}
                onClick={handleClose}
            ></div>
            <div className={`bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative flex flex-col transform transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
                {renderContent()}
            </div>
        </div>
    );
};

export default AccountModal;