/**
 * Supabase database row types (snake_case, matching DB schema).
 * These are the raw types returned from Supabase queries.
 */

export interface DbProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DbBankAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'savings' | 'current' | 'salary' | 'cash';
  balance: number;
  currency: string;
  created_at: string;
}

export interface DbCreditCard {
  id: string;
  user_id: string;
  name: string;
  credit_limit: number;
  outstanding: number;
  due_date: string | null;
  currency: string;
  created_at: string;
}

export interface DbTransaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  date: string;
  receipt_url: string | null;
  linked_account_id: string | null;
  linked_card_id: string | null;
  cashback: number | null;
  created_at: string;
}

export interface DbLoan {
  id: string;
  user_id: string;
  name: string;
  principal: number;
  rate: number;
  tenure_months: number;
  start_date: string;
  currency: string;
  created_at: string;
}

export interface DbAsset {
  id: string;
  user_id: string;
  name: string;
  type: 'property' | 'investment' | 'vehicle' | 'other';
  value: number;
  currency: string;
  created_at: string;
}

export interface DbBudgetGoal {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  currency: string;
  created_at: string;
}

export interface DbFinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline: string | null;
  icon: string;
  category: string;
  color: string;
  celebrated_milestones: number[];
  created_at: string;
}

export interface DbGoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  date: string;
  source: 'manual' | 'transaction';
  label: string | null;
  transaction_id: string | null;
  created_at: string;
}

export interface DbGoalLinkedTransaction {
  goal_id: string;
  transaction_id: string;
  user_id: string;
}

export interface DbChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url: string | null;
  parsed_intent: Record<string, unknown> | null;
  confirmed: boolean | null;
  is_loading: boolean;
  created_at: string;
}

export interface DbLLMSettings {
  id: string;
  user_id: string;
  provider: string;
  model: string;
  created_at: string;
}
