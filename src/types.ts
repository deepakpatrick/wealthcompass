export type AccountType = 'checking' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  limit?: number;
  currency: string;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  isManualCategory?: boolean;
  type: 'debit' | 'credit' | 'transfer';
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  associatedAccountId: string; // The account this bill is paid from
}

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'fifteen_days' | 'first_of_month';

export interface RecurringRule {
  id: string;
  accountId: string;
  name: string;
  amount: number; // positive for deposit, negative for debit
  frequency: Frequency;
  startDate: string;
  isActive: boolean;
}

export interface RuleOverride {
  id: string;
  ruleId: string;
  date: string; // yyyy-MM-dd
  amount: number;
  name: string;
}

export type ThemeType = 'compass' | 'slate' | 'emerald' | 'midnight';

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  primary: string;
  border: string;
  accent?: string;
}
