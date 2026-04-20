import { Account, Transaction, Bill } from '../types';

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'c1', name: 'Main Checking', type: 'checking', balance: 5240.50, currency: 'USD', color: '#10B981' },
  { id: 'c2', name: 'Savings Account', type: 'checking', balance: 12800.00, currency: 'USD', color: '#3B82F6' },
  { id: 'c3', name: 'Business Checking', type: 'checking', balance: 3450.00, currency: 'USD', color: '#8B5CF6' },
  { id: 'cc1', name: 'Amex Platinum', type: 'credit', balance: 1250.40, limit: 10000, currency: 'USD', color: '#6366F1' },
  { id: 'cc2', name: 'Chase Sapphire', type: 'credit', balance: 450.20, limit: 5000, currency: 'USD', color: '#F59E0B' },
  { id: 'cc3', name: 'Apple Card', type: 'credit', balance: 89.00, limit: 3000, currency: 'USD', color: '#1A1A1A' },
  { id: 'cc4', name: 'Amazon Prime', type: 'credit', balance: 340.10, limit: 2000, currency: 'USD', color: '#FF9900' },
  { id: 'cc5', name: 'Citi Double', type: 'credit', balance: 0.00, limit: 4000, currency: 'USD', color: '#004C97' },
  { id: 'cc6', name: 'Target RedCard', type: 'credit', balance: 12.50, limit: 1000, currency: 'USD', color: '#CC0000' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', accountId: 'c1', date: '2026-04-10', amount: -45.20, description: 'Whole Foods Market', category: 'Groceries', type: 'debit' },
  { id: 't2', accountId: 'c1', date: '2026-04-12', amount: -12.00, description: 'Starbucks Coffee', category: 'Dining', type: 'debit' },
  { id: 't3', accountId: 'cc1', date: '2026-04-13', amount: -125.00, description: 'Shell Gas Station', category: 'Transport', type: 'debit' },
  { id: 't4', accountId: 'cc1', date: '2026-04-14', amount: -850.00, description: 'Apple Store', category: 'Shopping', type: 'debit' },
  { id: 't5', accountId: 'cc2', date: '2026-04-15', amount: -60.00, description: 'Netflix Subscription', category: 'Entertainment', type: 'debit' },
  { id: 't6', accountId: 'c1', date: '2026-04-15', amount: 2500.00, description: 'Payroll Deposit', category: 'Income', type: 'credit' },
  { id: 't11', accountId: 'c1', date: '2026-04-17', amount: -2100.00, description: 'Bank of America Mortgage', category: 'Housing', type: 'debit' },
  { id: 't12', accountId: 'c1', date: '2026-04-18', amount: -120.50, description: 'Verizon Wireless', category: 'Utilities', type: 'debit' },
  { id: 't9', accountId: 'c3', date: '2026-04-19', amount: -250.00, description: 'AWS Cloud Services', category: 'Business', type: 'debit' },
  { id: 't10', accountId: 'c3', date: '2026-04-19', amount: 1500.00, description: 'Client Payment', category: 'Income', type: 'credit' },
];

export const MOCK_BILLS: Bill[] = [
  { id: 'b1', name: 'Mortgage Payment', amount: 2100.00, dueDate: '2026-05-01', isPaid: false, associatedAccountId: 'c1' },
  { id: 'b2', name: 'Car Insurance', amount: 180.00, dueDate: '2026-05-05', isPaid: false, associatedAccountId: 'c1' },
  { id: 'b3', name: 'Internet Bill', amount: 79.99, dueDate: '2026-05-10', isPaid: false, associatedAccountId: 'c1' },
  { id: 'b4', name: 'Amex Statement', amount: 1250.40, dueDate: '2026-05-15', isPaid: false, associatedAccountId: 'c1' },
  { id: 'b5', name: 'Office Rent', amount: 1200.00, dueDate: '2026-05-01', isPaid: false, associatedAccountId: 'c3' },
];
