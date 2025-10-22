
export interface Transaction {
    date: string;
    description: string;
    debit: number;
    credit: number;
}

export interface FinancingTerms {
    principal: number;
    interestRate: number;
    termYears: number;
    breakdown?: {
        [key: string]: number;
    };
}

export interface BaseTenant {
    id: number;
    floor: string;
    renter: string;
}

export interface MonthlyTenantRecord {
    id: number;
    monthlyRent: number | "TBD";
    due: number;
    received: number;
}

export interface MonthlyRentRecord {
    month: string;
    tenants: MonthlyTenantRecord[];
}

interface BaseAccount {
    name: string;
    subtitle: string;
    balance: number | null;
}

export interface PersonalAccount extends BaseAccount {
    type: 'personal';
    transactions: Transaction[];
}

export interface AssetAccount extends BaseAccount {
    type: 'asset';
    balance: number;
    transactions: Transaction[];
}

export interface LiabilityAccount extends BaseAccount {
    type: 'liability';
    balance: number;
    transactions: Transaction[];
    financingTerms?: FinancingTerms;
}

export interface RevenueAccount extends BaseAccount {
    type: 'revenue';
    balance: null;
    totalMonthlyRent: number;
    baseTenants: BaseTenant[];
    monthlyRecords: MonthlyRentRecord[];
}

export type Account = PersonalAccount | AssetAccount | LiabilityAccount | RevenueAccount;

export type AccountId = keyof AccountsData;

export interface AccountsData {
    juliePersonalFinances: PersonalAccount;
    davidPersonalFinances: PersonalAccount;
    llcBank: AssetAccount;
    llcSavings: AssetAccount;
    helocLoan: LiabilityAccount;
    memberLoan: LiabilityAccount;
    mortgageLoan: LiabilityAccount;
    propertyAsset: AssetAccount;
    rent: RevenueAccount;
}
