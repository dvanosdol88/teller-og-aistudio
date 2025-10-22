
import React from 'react';
import { FinancingTerms } from '../../../types';
import { formatCurrency } from '../../../utils/helpers';

interface AmortizationTabProps {
    terms: FinancingTerms;
}

const AmortizationTab: React.FC<AmortizationTabProps> = ({ terms }) => {
    const { principal, interestRate, termYears } = terms;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = termYears * 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const schedule = [];
    let remainingBalance = principal;
    for (let i = 1; i <= numberOfPayments; i++) {
        const interest = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interest;
        remainingBalance -= principalPayment;
        schedule.push({
            pmt: i,
            principal: principalPayment,
            interest: interest,
            balance: Math.abs(remainingBalance),
        });
    }
    
    return (
        <div>
            <div className="mb-4 text-center">
                <p className="text-sm text-slate-500">Calculated Monthly Payment</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(monthlyPayment)}</p>
            </div>
            <div className="overflow-auto max-h-96">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs text-slate-700 uppercase sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Pmt #</th>
                            <th className="px-4 py-3 text-right">Principal</th>
                            <th className="px-4 py-3 text-right">Interest</th>
                            <th className="px-4 py-3 text-right">Remaining Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map(row => (
                             <tr key={row.pmt} className="bg-white border-b">
                                <td className="px-4 py-2">{row.pmt}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(row.principal)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(row.interest)}</td>
                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(row.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AmortizationTab;
