// Transaction types
export interface Transaction {
  id: number;
  date: string;
  type: "income" | "expense" | "transfer";
  category: string;
  description: string;
  amount: number;
  currency: Currency;
  asset_id?: string;
  memo?: string;
  tags?: string[];
}

export interface TransactionCreateInput {
  date: string;
  type: "income" | "expense" | "transfer";
  category: string;
  description: string;
  amount: number;
  currency?: Currency;
  asset_id?: string;
  memo?: string;
}

// Subscription types
export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  billing_cycle: "monthly" | "yearly" | "weekly";
  next_billing_date: string;
  category: string;
  active: boolean;
  payment_method?: string;
  notes?: string;
  created_at?: string;
  type?: "ai" | "general";
}

export interface SubscriptionCreateInput {
  name: string;
  amount: number;
  currency?: Currency;
  billing_cycle: "monthly" | "yearly" | "weekly";
  next_billing_date: string;
  category: string;
  payment_method?: string;
  notes?: string;
  type?: "ai" | "general";
}

// Dashboard types
export interface DashboardSummary {
  month: string;
  summary: {
    total_assets: number;
    monthly_income: number;
    monthly_expense: number;
    monthly_balance: number;
    fixed_costs_total: number;
    currency: Currency;
  };
  daily_breakdown: DailyBreakdown[];
  category_breakdown: CategoryBreakdown[];
  subscriptions_summary: SubscriptionsSummary;
}

export interface DailyBreakdown {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface SubscriptionsSummary {
  total_monthly: number;
  active_count: number;
  categories: Record<string, number>;
}

// Settings types
export interface AppSettings {
  theme: "dark" | "light" | "system";
  currency: Currency;
  language: "ko" | "en";
  telegram_enabled: boolean;
  telegram_chat_id?: string;
  auto_refresh_interval: number;
}

// Exchange rate types
export interface ExchangeRates {
  base: Currency;
  rates: Record<Currency, number>;
  updated_at: string;
}

// Common types
export type Currency = "KRW" | "USD" | "JPY" | "EUR";

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Budget types
export interface Budget {
  category: string;
  amount: number;
  spent: number;
  currency: Currency;
}

// Asset types
export interface Asset {
  id: string;
  name: string;
  type: "bank" | "card" | "cash" | "investment";
  balance: number;
  currency: Currency;
}
