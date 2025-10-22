
import React from 'react';
import { formatCurrency } from '../utils/helpers';

interface AccountCardProps {
    onClick: () => void;
    label: string;
    balance: number | null;
    isLiability?: boolean;
    className?: string;
    labelClassName?: string;
    balanceClassName?: string;
}

const AccountCard: React.FC<AccountCardProps> = ({
    onClick,
    label,
    balance,
    isLiability = false,
    className,
    labelClassName,
    balanceClassName,
}) => {
    const baseCardClass = "cursor-pointer transition-all ease-in-out duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl";
    const defaultCardClass = isLiability ? "bg-rose-50 p-4 rounded-lg" : "bg-green-50 p-4 rounded-lg";
    const defaultLabelClass = isLiability ? "font-semibold text-rose-700" : "font-semibold text-slate-700";
    const defaultBalanceClass = isLiability ? "font-bold text-rose-900" : "font-bold text-slate-900";
    
    return (
        <div onClick={onClick} className={`${baseCardClass} ${className || defaultCardClass}`}>
            <div className="flex justify-between items-center">
                <span className={labelClassName || defaultLabelClass}>{label}</span>
                <span className={balanceClassName || defaultBalanceClass}>{formatCurrency(balance)}</span>
            </div>
        </div>
    );
};

export default AccountCard;
