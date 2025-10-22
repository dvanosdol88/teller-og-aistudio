
import React from 'react';
import { AccountId, AccountsData } from '../types';
import { formatCurrency } from '../utils/helpers';
import AccountCard from './AccountCard';

interface DashboardProps {
    accountsData: AccountsData;
    totalEquity: number;
    onCardClick: (accountId: AccountId | 'totalEquity') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ accountsData, totalEquity, onCardClick }) => {
    return (
        <section id="dashboard" className="mb-16 relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-16 items-start">
                {/* Personal Members & Rent */}
                <div className="text-center space-y-8">
                    <div className="flex justify-center items-center gap-8">
                        <div
                            onClick={() => onCardClick('juliePersonalFinances')}
                            className="account-card bg-white w-32 h-32 rounded-full shadow-lg border border-slate-200 flex items-center justify-center"
                        >
                            <h4 className="font-bold text-slate-800 text-xl">Julie</h4>
                        </div>
                        <div
                            onClick={() => onCardClick('davidPersonalFinances')}
                            className="account-card bg-white w-32 h-32 rounded-full shadow-lg border border-slate-200 flex items-center justify-center"
                        >
                            <h4 className="font-bold text-slate-800 text-xl">David</h4>
                        </div>
                    </div>
                    <AccountCard
                        onClick={() => onCardClick('helocLoan')}
                        className="bg-rose-50 p-4 rounded-full max-w-xs mx-auto"
                        label="HELOC Loan"
                        labelClassName="font-semibold text-rose-700"
                        balance={accountsData.helocLoan.balance}
                        balanceClassName="font-bold text-rose-900"
                    />
                     <div onClick={() => onCardClick('rent')} className="account-card bg-green-50 p-3 rounded-lg max-w-[220px] mx-auto cursor-pointer transition-all ease-in-out duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl">
                        <div className="text-center">
                            <span className="font-semibold text-slate-800">Rent Roll</span>
                            <p className="font-bold text-slate-900 text-xl">{formatCurrency(accountsData.rent.totalMonthlyRent)}</p>
                            <p className="text-xs text-slate-600">Total Monthly Rent</p>
                        </div>
                    </div>
                </div>

                {/* LLC Assets and Liabilities */}
                <div className="lg:col-span-2 text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">672 Elm St., LLC</h3>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Assets Column */}
                            <div>
                                <h4 className="font-bold text-slate-800 text-xl mb-4 text-center">Assets</h4>
                                <div className="space-y-4">
                                    <AccountCard onClick={() => onCardClick('propertyAsset')} label="672 Elm St" balance={accountsData.propertyAsset.balance} />
                                    <AccountCard onClick={() => onCardClick('llcBank')} label="LLC Checking" balance={accountsData.llcBank.balance} />
                                    <AccountCard onClick={() => onCardClick('llcSavings')} label="LLC Savings" balance={accountsData.llcSavings.balance} />
                                </div>
                            </div>
                            {/* Liabilities Column */}
                            <div>
                                <h4 className="font-bold text-slate-800 text-xl mb-4 text-center">Liabilities</h4>
                                <div className="space-y-4">
                                    <AccountCard onClick={() => onCardClick('mortgageLoan')} label="672 Elm St. Mortgage" balance={accountsData.mortgageLoan.balance} isLiability />
                                    <AccountCard onClick={() => onCardClick('memberLoan')} label="Member Loan (Roof)" balance={accountsData.memberLoan.balance} isLiability />
                                </div>
                            </div>
                        </div>
                         <div className="mt-8 text-center">
                            <div onClick={() => onCardClick('totalEquity')} className="account-card bg-green-100 p-4 rounded-lg max-w-xs mx-auto cursor-pointer transition-all ease-in-out duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl">
                                <span className="font-semibold text-slate-800">Total Equity</span>
                                <p className="font-bold text-green-800 text-2xl">{formatCurrency(totalEquity)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
