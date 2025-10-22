
import React, { useState, useMemo, useEffect } from 'react';
import { RevenueAccount, BaseTenant, MonthlyTenantRecord } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface RentRollContentProps {
    account: RevenueAccount;
    onSave: (updatedAccount: RevenueAccount) => Promise<void>;
    onClose: () => void;
}

const RentRollContent: React.FC<RentRollContentProps> = ({ account, onSave, onClose }) => {
    const [editedAccount, setEditedAccount] = useState<RevenueAccount>(account);
    const [isSaving, setIsSaving] = useState(false);
    const [currentMonthStr, setCurrentMonthStr] = useState<string>(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    const currentMonthRecord = useMemo(() => {
        let record = editedAccount.monthlyRecords.find(r => r.month === currentMonthStr);
        if (!record) {
            const lastRecord = editedAccount.monthlyRecords[editedAccount.monthlyRecords.length - 1] || { tenants: [] };
            record = {
                month: currentMonthStr,
                tenants: editedAccount.baseTenants.map(bt => {
                    const lastTenantData = lastRecord.tenants.find(t => t.id === bt.id);
                    return { 
                        id: bt.id, 
                        monthlyRent: lastTenantData?.monthlyRent ?? "TBD", 
                        due: 0, 
                        received: 0 
                    };
                })
            };
        }
        return record;
    }, [editedAccount, currentMonthStr]);
    
    useEffect(() => {
        if (!editedAccount.monthlyRecords.find(r => r.month === currentMonthStr)) {
            const newRecords = [...editedAccount.monthlyRecords, currentMonthRecord];
            newRecords.sort((a,b) => a.month.localeCompare(b.month));
            setEditedAccount(prev => ({ ...prev, monthlyRecords: newRecords }));
        }
    }, [currentMonthRecord, currentMonthStr, editedAccount.monthlyRecords]);

    const handleMonthChange = (direction: 'prev' | 'next') => {
        const currentDate = new Date(currentMonthStr + '-02');
        currentDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentMonthStr(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`);
    };

    const handleTenantChange = (tenantId: number, field: keyof MonthlyTenantRecord | 'renter', value: string) => {
        const updatedAccount = { ...editedAccount };

        if (field === 'renter') {
            const baseTenantIndex = updatedAccount.baseTenants.findIndex(t => t.id === tenantId);
            if (baseTenantIndex !== -1) {
                updatedAccount.baseTenants[baseTenantIndex].renter = value;
            }
        } else {
            const recordIndex = updatedAccount.monthlyRecords.findIndex(r => r.month === currentMonthStr);
            if (recordIndex === -1) return;

            const tenantIndex = updatedAccount.monthlyRecords[recordIndex].tenants.findIndex(t => t.id === tenantId);
            if (tenantIndex === -1) return;
            
            let parsedValue: number | "TBD" | string = value;
            if (field === 'monthlyRent') {
                parsedValue = value === '' || isNaN(parseFloat(value)) ? "TBD" : parseFloat(value);
            } else {
                parsedValue = parseFloat(value) || 0;
            }

            (updatedAccount.monthlyRecords[recordIndex].tenants[tenantIndex] as any)[field] = parsedValue;
        }
        setEditedAccount(updatedAccount);
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        const latestMonth = editedAccount.monthlyRecords.reduce((latest, record) => record.month > latest.month ? record : latest, editedAccount.monthlyRecords[0]);
        const totalRent = latestMonth.tenants.reduce((total, tenant) => {
            const rent = typeof tenant.monthlyRent === 'number' ? tenant.monthlyRent : 0;
            return total + rent;
        }, 0);
        await onSave({ ...editedAccount, totalMonthlyRent: totalRent });
    };

    const monthDisplay = new Date(currentMonthStr + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });
    const floors = ['3rd Floor', '2nd Floor', '1st Floor', 'Barn'];

    const totalMonthlyRentForCurrentMonth = currentMonthRecord.tenants.reduce((total, tenant) => {
        const rent = typeof tenant.monthlyRent === 'number' ? tenant.monthlyRent : 0;
        return total + rent;
    }, 0);

    return (
        <>
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">{editedAccount.name}</h3>
                    <p className="text-sm text-slate-500">{editedAccount.subtitle}</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
            </div>
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="flex justify-between items-center w-full pb-6">
                    <button onClick={() => handleMonthChange('prev')} className="px-3 py-1 bg-slate-200 rounded-md hover:bg-slate-300">&lt; Prev</button>
                    <span className="font-bold text-lg">{monthDisplay}</span>
                    <button onClick={() => handleMonthChange('next')} className="px-3 py-1 bg-slate-200 rounded-md hover:bg-slate-300">Next &gt;</button>
                </div>

                {floors.map(floor => {
                    const tenantsOnFloor = editedAccount.baseTenants.filter(t => t.floor === floor);
                    if (tenantsOnFloor.length === 0) return null;
                    const floorSubtotal = tenantsOnFloor.reduce((total, baseTenant) => {
                        const tenantData = currentMonthRecord.tenants.find(t => t.id === baseTenant.id);
                        const rent = typeof tenantData?.monthlyRent === 'number' ? tenantData.monthlyRent : 0;
                        return total + rent;
                    }, 0);

                    return (
                        <div key={floor} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">{floor}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-200 text-xs text-slate-700 uppercase">
                                        <tr>
                                            <th className="px-2 py-2">Renter</th>
                                            <th className="px-2 py-2 text-right">Monthly Rent</th>
                                            <th className="px-2 py-2 text-right">$ Due</th>
                                            <th className="px-2 py-2 text-right">$ Received</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenantsOnFloor.map(baseTenant => {
                                            const tenantData = currentMonthRecord.tenants.find(t => t.id === baseTenant.id) || { monthlyRent: 'TBD', due: 0, received: 0 };
                                            return (
                                                <tr key={baseTenant.id} className="bg-white border-b">
                                                    <td className="px-2 py-2"><input type="text" value={baseTenant.renter} onChange={e => handleTenantChange(baseTenant.id, 'renter', e.target.value)} className="w-full border rounded p-1"/></td>
                                                    <td className="px-2 py-2"><input type="text" value={tenantData.monthlyRent === 'TBD' ? '' : tenantData.monthlyRent} placeholder={tenantData.monthlyRent === 'TBD' ? 'TBD' : '0.00'} onChange={e => handleTenantChange(baseTenant.id, 'monthlyRent', e.target.value)} className="w-full border rounded p-1 text-right"/></td>
                                                    <td className="px-2 py-2"><input type="number" step="0.01" value={tenantData.due} onChange={e => handleTenantChange(baseTenant.id, 'due', e.target.value)} className="w-full border rounded p-1 text-right"/></td>
                                                    <td className="px-2 py-2"><input type="number" step="0.01" value={tenantData.received} onChange={e => handleTenantChange(baseTenant.id, 'received', e.target.value)} className="w-full border rounded p-1 text-right"/></td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-slate-100 font-bold">
                                            <td className="px-2 py-2 text-right">Sub-total</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(floorSubtotal)}</td>
                                            <td className="px-2 py-2"></td>
                                            <td className="px-2 py-2"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
                 <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
                    <div className="flex justify-end items-center">
                        <h4 className="font-bold text-lg text-blue-800 mr-4">Total Monthly Rent:</h4>
                        <p className="text-xl font-bold text-blue-900">{formatCurrency(totalMonthlyRentForCurrentMonth)}</p>
                    </div>
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

export default RentRollContent;