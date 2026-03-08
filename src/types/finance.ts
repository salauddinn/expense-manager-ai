/**
 * Finance domain types.
 *
 * Central type definitions for all financial entities used across the app.
 */

// ── Enums & Unions ──

export type TransactionType = 'income' | 'expense';

export type CategoryType =
  | 'food' | 'transport' | 'shopping' | 'bills' | 'entertainment'
  | 'health' | 'education' | 'rent' | 'groceries' | 'travel'
  | 'salary' | 'freelance' | 'investment' | 'gift' | 'refund' | 'other';

export type BankAccountType = 'savings' | 'current' | 'salary';

export type AssetType = 'property' | 'investment' | 'vehicle' | 'other';

// ── Entities ──

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: CategoryType;
  description: string;
  date: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: BankAccountType;
  balance: number;
  currency: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  outstanding: number;
  dueDate: string;
  currency: string;
}

export interface Loan {
  id: string;
  name: string;
  principal: number;
  rate: number;
  tenureMonths: number;
  startDate: string;
  currency: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  currency: string;
}

export interface BudgetGoal {
  id: string;
  category: CategoryType;
  monthlyLimit: number;
  currency: string;
}

