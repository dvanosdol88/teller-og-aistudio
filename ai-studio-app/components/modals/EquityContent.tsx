
import React from 'react';
import { formatCurrency } from '../../utils/helpers';

interface EquityContentProps {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
}

const EquityContent: React.FC<EquityContentProps> = ({ totalAssets, totalLiabilities, totalEquity }) => {
    return (
        <div className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-4 text-center">
                <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-700">Total Assets</p>
                    <p className="text-3xl font-bold text-green-900">{formatCurrency(totalAssets)}</p>
                </div>
                <p className="text-2xl font-bold text-slate-500">-</p>
                <div className="bg-rose-50 p-4 rounded-lg">
                    <p className="text-sm text-rose-700">Total Liabilities</p>
                    <p className="text-3xl font-bold text-rose-900">{formatCurrency(totalLiabilities)}</p>
                </div>
                <p className="text-2xl font-bold text-slate-500">=</p>
                <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-indigo-700">Owner's Equity</p>
                    <p className="text-3xl font-bold text-indigo-900">{formatCurrency(totalEquity)}</p>
                </div>
            </div>
        </div>
    );
};

export default EquityContent;
