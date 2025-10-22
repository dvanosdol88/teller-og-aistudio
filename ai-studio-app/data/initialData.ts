
import { AccountsData } from '../types';

export const initialAccountsData: AccountsData = {
    juliePersonalFinances: {
        name: "Julie's Finances",
        subtitle: "Transactions related to the LLC.",
        balance: null,
        type: 'personal',
        transactions: [
            { date: '2025-01-15', description: 'Loan to LLC (from HELOC)', debit: 0, credit: 50000 },
            { date: '2025-03-05', description: 'Loan to LLC (Roof Share)', debit: 0, credit: 7500 },
            { date: '2025-04-05', description: 'Distribution from LLC', debit: 1000, credit: 0 },
            { date: '2025-04-06', description: 'Payment to HELOC Lender', debit: 0, credit: 500 },
            { date: '2025-04-06', description: 'Share of Mortgage Payment', debit: 0, credit: 750 },
        ]
    },
    davidPersonalFinances: {
        name: "David's Finances",
        subtitle: "Transactions related to the LLC.",
        balance: null,
        type: 'personal',
        transactions: [
            { date: '2025-03-05', description: 'Loan to LLC (Roof Share)', debit: 0, credit: 7500 },
            { date: '2025-04-05', description: 'Distribution from LLC', debit: 1000, credit: 0 },
            { date: '2025-04-06', description: 'Share of Mortgage Payment', debit: 0, credit: 750 },
        ]
    },
    llcBank: {
        name: "LLC Checking",
        subtitle: "Central hub for all business income and expenses.",
        balance: 31500,
        type: 'asset',
        transactions: [
            { date: '2025-01-15', description: 'Loan from Julie (HELOC)', debit: 50000, credit: 0 },
            { date: '2025-03-05', description: 'Loan from Members (Roof)', debit: 15000, credit: 0 },
            { date: '2025-03-10', description: 'Payment to Roofer', debit: 0, credit: 15000 },
            { date: '2025-04-01', description: 'Rental Income Received', debit: 3500, credit: 0 },
            { date: '2025-04-05', description: 'Distribution to Members', debit: 0, credit: 2000 },
        ]
    },
    llcSavings: {
        name: "LLC Savings",
        subtitle: "Reserve funds for future capital expenditures.",
        balance: 0,
        type: 'asset',
        transactions: [
             { date: '2025-05-01', description: 'Initial Transfer from Checking', debit: 0, credit: 0 },
        ]
    },
    helocLoan: {
        name: "HELOC Loan",
        subtitle: "Liability from Julie's HELOC for the down payment.",
        balance: 50000,
        type: 'liability',
        transactions: [
            { date: '2025-01-15', description: 'Loan from Julie', debit: 0, credit: 50000 },
        ],
        financingTerms: {
            principal: 50000,
            interestRate: 6.5,
            termYears: 15,
            breakdown: {
                Total: 50000,
                Julie: 50000,
                David: 0
            }
        }
    },
    memberLoan: {
        name: "Member Loan (Roof)",
        subtitle: "A formal liability owed by the LLC to its members.",
        balance: 15000,
        type: 'liability',
        transactions: [
            { date: '2025-03-05', description: 'Loan proceeds for roof', debit: 0, credit: 15000 },
        ],
        financingTerms: {
            principal: 15000,
            interestRate: 5.0,
            termYears: 10,
            breakdown: {
                Total: 15000,
                Julie: 7500,
                David: 7500
            }
        }
    },
    mortgageLoan: {
        name: "672 Elm St. Mortgage",
        subtitle: "Primary mortgage for the investment property.",
        balance: 200000,
        type: 'liability',
        transactions: [
            { date: '2025-01-20', description: 'Initial Mortgage Loan', debit: 0, credit: 200000 },
        ],
        financingTerms: {
            principal: 200000,
            interestRate: 7.1,
            termYears: 30
        }
    },
    propertyAsset: {
        name: "672 Elm St",
        subtitle: "The capitalized value of the building and improvements.",
        balance: 265000,
        type: 'asset',
        transactions: [
            { date: '2025-01-20', description: 'Property Acquisition (Building Value)', debit: 250000, credit: 0 },
            { date: '2025-03-10', description: 'Capital Improvement (New Roof)', debit: 15000, credit: 0 },
        ]
    },
    rent: {
        name: "Rent Roll",
        subtitle: "Monthly rental income from all units.",
        balance: null,
        totalMonthlyRent: 5000,
        type: 'revenue',
        baseTenants: [
            { id: 0, floor: "1st Floor", renter: "NA" },
            { id: 1, floor: "2nd Floor", renter: "Gina" },
            { id: 2, floor: "2nd Floor", renter: "ECC" },
            { id: 3, floor: "3rd Floor", renter: "Timoth" },
            { id: 4, floor: "3rd Floor", renter: "Angua" },
            { id: 5, floor: "Barn", renter: "Steve" }
        ],
        monthlyRecords: [
            {
                month: "2025-08",
                tenants: [
                    { id: 0, monthlyRent: "TBD", due: 0, received: 0 },
                    { id: 1, monthlyRent: 1300, due: 1300, received: 1300 },
                    { id: 2, monthlyRent: 1250, due: 1250, received: 1250 },
                    { id: 3, monthlyRent: 1200, due: 1200, received: 0 },
                    { id: 4, monthlyRent: 0, due: 0, received: 0 },
                    { id: 5, monthlyRent: 1250, due: 1250, received: 1250 }
                ]
            }
        ]
    }
};
