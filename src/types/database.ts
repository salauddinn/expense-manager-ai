/**
 * Supabase database row types (snake_case, matching DB schema).
 * These are the raw types returned from Supabase queries.
 */

import type { CategoryType } from './finance';

/** Fields present on every user-owned table row. */
interface DbBaseRow {
  id: string;
  user_id: string;
  created_at: string;
}

export interface DbProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DbBankAccount extends DbBaseRow {
  name: string;
  type: 'savings' | 'current' | 'salary' | 'cash';
  balance: number;
  currency: string;
}

export interface DbCreditCard extends DbBaseRow {
  name: string;
  credit_limit: number;
  outstanding: number;
  due_date: string | null;
  currency: string;
}

export interface DbTransaction extends DbBaseRow {
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: CategoryType;
  description: string | null;
  date: string;
  receipt_url: string | null;
  linked_account_id: string | null;
  linked_card_id: string | null;
  cashback: number | null;
}

export interface DbLoan extends DbBaseRow {
  name: string;
  principal: number;
  rate: number;
  tenure_months: number;
  start_date: string;
  currency: string;
}

export interface DbAsset extends DbBaseRow {
  name: string;
  type: 'property' | 'investment' | 'vehicle' | 'other';
  value: number;
  currency: string;
}

export interface DbBudgetGoal extends DbBaseRow {
  category: CategoryType;
  monthly_limit: number;
  currency: string;
}

export interface DbFinancialGoal extends DbBaseRow {
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline: string | null;
  icon: string;
  category: string;
  color: string;
  celebrated_milestones: number[];
}

export interface DbGoalContribution extends DbBaseRow {
  goal_id: string;
  amount: number;
  date: string;
  source: 'manual' | 'transaction';
  label: string | null;
  transaction_id: string | null;
}

export interface DbGoalLinkedTransaction {
  goal_id: string;
  transaction_id: string;
  user_id: string;
}

export interface DbChatMessage extends DbBaseRow {
  role: 'user' | 'assistant';
  content: string;
  image_url: string | null;
  parsed_intent: Record<string, unknown> | null;
  confirmed: boolean | null;
  is_loading: boolean;
}

export interface DbLLMSettings extends DbBaseRow {
  provider: string;
  model: string;
}

export interface DbRecurringTransaction extends DbBaseRow {
  title: string;
  amount: number;
  currency: string;
  category: CategoryType;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_due: string;
  linked_account_id: string | null;
  linked_card_id: string | null;
  is_active: boolean;
}
