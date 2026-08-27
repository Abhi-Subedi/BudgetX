export interface User {
  id: number;
  email: string;
  name: string;
  currency: string;
  locale: string;
  is_admin: boolean;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type TxnType = "expense" | "income";

export interface Category {
  id: number;
  name: string;
  kind: "expense" | "income";
  color: string;
}

export type AccountType = "cash" | "bank" | "wallet" | "credit" | "savings" | "investment";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  currency: string;
  opening_balance: number;
  archived: boolean;
  balance: number;
}

export interface Split {
  user_id: number;
  share: number;
}

export interface Transaction {
  id: number;
  amount: number;
  type: TxnType;
  account_id: number;
  category_id: number | null;
  occurred_at: string;
  payee: string | null;
  note: string | null;
  group_id: number | null;
  splits: Split[];
  category_name: string | null;
  category_color: string | null;
  account_name: string | null;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
}

export interface BudgetItemProgress {
  item_id: number;
  category_id: number;
  category_name: string;
  category_color: string;
  budgeted: number;
  spent: number;
  remaining: number;
  pct_used: number;
}

export interface BudgetProgress {
  id: number;
  name: string;
  month: string;
  total_budget: number;
  total_spent: number;
  days_left: number;
  items: BudgetItemProgress[];
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  color: string;
  group_id: number | null;
}

export interface GroupSummary {
  id: number;
  name: string;
  currency: string;
  invite_code: string;
  owner_id: number;
  member_count: number;
}

export interface GroupMemberInfo {
  user_id: number;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
}

export interface GroupDetail extends GroupSummary {
  your_role: "owner" | "admin" | "member";
  members: GroupMemberInfo[];
}

export interface DebtEdge {
  from_user_id: number;
  to_user_id: number;
  amount: number;
}

export interface GroupBalance {
  user_id: number;
  name: string;
  net: number;
  owes: DebtEdge[];
}

export interface GroupActivityItem {
  transaction_id: number;
  description: string;
  amount: number;
  occurred_at: string;
  paid_by_id: number;
  paid_by_name: string;
  your_share: number;
}

export interface RecurringRule {
  id: number;
  amount: number;
  type: TxnType;
  account_id: number;
  category_id: number | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  next_run_date: string;
  end_date: string | null;
  payee: string | null;
  note: string | null;
  active: boolean;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string | null;
}

export interface MonthTotals {
  income: number;
  expense: number;
  saved: number;
  savings_rate: number;
}

export interface SpendingPoint {
  day: number;
  current: number;
  previous: number;
}

export interface BudgetAttention {
  budget_id: number;
  item_id: number;
  category_name: string;
  pct_used: number;
}

export interface UpcomingRecurring {
  id: number;
  payee: string | null;
  amount: number;
  next_run_date: string;
  frequency: string;
}

export interface DashboardData {
  balance_total: number;
  month_totals: MonthTotals;
  previous_month_totals: MonthTotals;
  spending_series: SpendingPoint[];
  budget_attention: BudgetAttention[];
  recent_transactions: Transaction[];
  goals: Goal[];
  upcoming_recurring: UpcomingRecurring[];
  currency: string;
}

export interface CategorySlice {
  category_id: number | null;
  name: string;
  color: string;
  amount: number;
  pct: number;
}

export interface LargestExpense {
  id: number;
  payee: string | null;
  note: string | null;
  amount: number;
  occurred_at: string;
  category_name: string | null;
}

export interface AnalyticsOverview {
  month: string;
  totals: MonthTotals;
  previous_totals: MonthTotals;
  by_category: CategorySlice[];
  largest_expenses: LargestExpense[];
}

export interface TrendPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface Bill {
  id: number;
  name: string;
  amount: number;
  category: string;
  due_date: string;
  frequency: "monthly" | "weekly" | "yearly" | "one_time";
  status: "pending" | "paid" | "overdue";
  account_id: number;
}

export interface BillSummary {
  total_monthly: number;
  paid_count: number;
  overdue_count: number;
  pending_count: number;
}

export interface Subscription {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  next_billing_date: string;
  active: boolean;
  account_id: number;
}

export interface SubscriptionSummary {
  monthly_cost: number;
  annual_cost: number;
  active_count: number;
}

export interface Investment {
  id: number;
  name: string;
  investment_type: "stock" | "mutual_fund" | "bond" | "fixed_deposit" | "crypto" | "other";
  symbol: string | null;
  units: number;
  buy_price: number;
  current_price: number;
  buy_date: string;
  account_id: number;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  profit_loss: number;
  roi_pct: number;
  allocation: Array<{ investment_type: string; current_value: number; pct: number }>;
}

export interface BalanceProjection {
  days: number;
  projected_balance: number;
  current_balance: number;
}

export interface SpendingProjection {
  category: string;
  amount: number;
  pct: number;
}

export interface CashWarning {
  id: number;
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
  date: string | null;
}

export interface GoalFeasibility {
  goal_id: number;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  monthly_savings_needed: number;
  feasible: boolean;
  deadline: string | null;
}
