
export const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    return Number(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};
