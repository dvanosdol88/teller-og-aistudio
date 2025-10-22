
import React from 'react';
import { FinancingTerms } from '../../../types';
import { formatCurrency } from '../../../utils/helpers';

interface FinancingTermsTabProps {
    terms: FinancingTerms;
    onTermsChange: (updatedTerms: FinancingTerms) => void;
}

const FinancingTermsTab: React.FC<FinancingTermsTabProps> = ({ terms, onTermsChange }) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = parseFloat(value) || 0;
        onTermsChange({
            ...terms,
            [name]: numericValue,
        });
    };
    
    const handleBreakdownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = parseFloat(value) || 0;
        const updatedBreakdown = {
            ...terms.breakdown,
            [name]: numericValue
        };

        // Recalculate total principal from breakdown
        // FIX: Cast `val` to a number inside the reducer. `Object.values` on an object with a
        // string index signature can return `unknown[]`, causing a type error during addition.
        const totalPrincipal = Object.values(updatedBreakdown).reduce((sum, val) => sum + (Number(val) || 0), 0);

        onTermsChange({
            ...terms,
            principal: totalPrincipal,
            breakdown: updatedBreakdown,
        });
    };

    const breakdownFields = terms.breakdown 
        ? Object.entries(terms.breakdown).map(([key, value]) => ({ key, value }))
        : [{ key: 'Total', value: terms.principal }];
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <h4 className="text-lg font-semibold text-slate-700 mb-2">Principal Details</h4>
                <div className="grid grid-cols-2 gap-4">
                    {breakdownFields.map(({ key, value }) => (
                        <div key={key}>
                            <label htmlFor={`principal_${key}`} className="block text-sm font-medium text-slate-600">
                                Principal ({key})
                            </label>
                            <input
                                id={`principal_${key}`}
                                type="number"
                                name={key}
                                value={value}
                                onChange={handleBreakdownChange}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    ))}
                    <div className="bg-slate-100 p-3 rounded-lg text-right col-span-2">
                        <p className="text-sm font-medium text-slate-600">Total Principal</p>
                        <p className="text-xl font-bold text-slate-800">{formatCurrency(terms.principal)}</p>
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-slate-600">
                    Interest Rate (%)
                </label>
                <input
                    id="interestRate"
                    type="number"
                    name="interestRate"
                    step="0.01"
                    value={terms.interestRate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
             <div>
                <label htmlFor="termYears" className="block text-sm font-medium text-slate-600">
                    Term (Years)
                </label>
                <input
                    id="termYears"
                    type="number"
                    name="termYears"
                    value={terms.termYears}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
        </div>
    );
};

export default FinancingTermsTab;