import React from 'react';
import { Transaction } from '../../../types';

interface TransactionsTabProps {
    transactions: Transaction[];
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions }) => {
    // Sort transactions by date in descending order and take the last 5.
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs text-slate-700 uppercase">
                        <tr>
                            <th className="px-2 py-3">Date</th>
                            <th className="px-2 py-3">Description</th>
                            <th className="px-2 py-3 text-right">Debit (In)</th>
                            <th className="px-2 py-3 text-right">Credit (Out)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentTransactions.map((tx, index) => (
                            <tr key={index} className="bg-white border-b">
                                <td className="px-2 py-2">
                                    <input 
                                        type="date" 
                                        className="w-full border rounded p-1 bg-slate-100 cursor-not-allowed" 
                                        value={tx.date}
                                        readOnly={true}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input 
                                        type="text" 
                                        className="w-full border rounded p-1 bg-slate-100 cursor-not-allowed" 
                                        value={tx.description}
                                        readOnly={true}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        className="w-full border rounded p-1 text-right bg-slate-100 cursor-not-allowed" 
                                        value={tx.debit}
                                        readOnly={true}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        className="w-full border rounded p-1 text-right bg-slate-100 cursor-not-allowed" 
                                        value={tx.credit}
                                        readOnly={true}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
                <p className="text-sm text-slate-500 italic">Showing the 5 most recent transactions. Data is read-only and sourced directly from the bank.</p>
            </div>
        </div>
    );
};

export default TransactionsTab;