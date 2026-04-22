export type Currency = 'USD' | 'COP';
export type TransactionType = 'income' | 'expense';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export type FinanceTab = 'overview' | 'transactions' | 'budgets' | 'goals' | 'debts' | 'market';

export interface FinanceProfile {
  id: string;
  clerk_id: string;
  currency: Currency;
  monthly_salary: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionCategory {
  id: string;
  clerk_id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  clerk_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  is_recurring: boolean;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  category_name?: string;
  category_color?: string;
}

export interface RecurringTemplate {
  id: string;
  clerk_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  next_due: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  category_name?: string;
  category_color?: string;
}

export interface Budget {
  id: string;
  clerk_id: string;
  category_id: string;
  month: number;
  year: number;
  limit_amount: number;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
  // computed
  category_name?: string;
  category_color?: string;
  spent_amount?: number;
}

export interface SavingsGoal {
  id: string;
  clerk_id: string;
  name: string;
  target_amount: number;
  deadline: string | null;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // computed
  current_amount?: number;
}

export interface SavingsContribution {
  id: string;
  goal_id: string;
  clerk_id: string;
  amount: number;
  note: string | null;
  contributed_at: string;
  created_at: string;
}

export interface Debt {
  id: string;
  clerk_id: string;
  creditor_name: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  minimum_payment: number | null;
  due_day: number | null;
  notes: string | null;
  is_paid_off: boolean;
  created_at: string;
  updated_at: string;
  // computed
  total_paid?: number;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  clerk_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
}

export interface MarketItem {
  id: string;
  clerk_id: string;
  name: string;
  quantity: string | null;
  estimated_price: number | null;
  is_checked: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OverviewData {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  savings_rate: number;
  by_category: { category_id: string; name: string; color: string; total: number }[];
  monthly_history: { month: number; year: number; income: number; expenses: number }[];
  daily_burn: { date: string; cumulative_expense: number }[];
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: '$',
  COP: '$',
};

export const CURRENCY_LOCALE: Record<Currency, string> = {
  USD: 'en-US',
  COP: 'es-CO',
};

export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'COP' ? 0 : 2,
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(amount);
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DEFAULT_CATEGORIES: Omit<TransactionCategory, 'id' | 'clerk_id' | 'created_at'>[] = [
  { name: 'Salary', type: 'income', color: '#22c55e', icon: 'Wallet', is_default: true },
  { name: 'Freelance', type: 'income', color: '#10b981', icon: 'Code', is_default: true },
  { name: 'Extra Income', type: 'income', color: '#34d399', icon: 'ArrowUpCircle', is_default: true },
  { name: 'Housing', type: 'expense', color: '#ff003c', icon: 'Home', is_default: true },
  { name: 'Food & Groceries', type: 'expense', color: '#f97316', icon: 'ShoppingCart', is_default: true },
  { name: 'Transport', type: 'expense', color: '#facc15', icon: 'Car', is_default: true },
  { name: 'Subscriptions', type: 'expense', color: '#a855f7', icon: 'Repeat', is_default: true },
  { name: 'Entertainment', type: 'expense', color: '#ec4899', icon: 'Play', is_default: true },
  { name: 'Health', type: 'expense', color: '#06b6d4', icon: 'Activity', is_default: true },
  { name: 'Savings', type: 'expense', color: '#3b82f6', icon: 'PiggyBank', is_default: true },
  { name: 'Other', type: 'expense', color: '#64748b', icon: 'Box', is_default: true },
];
