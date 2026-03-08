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
  /** Linked bank account ID — balance auto-updated on save */
  linkedAccountId?: string;
  /** Linked credit card ID — outstanding auto-updated on save */
  linkedCardId?: string;
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

export type GoalCategory = 'emergency' | 'travel' | 'education' | 'home' | 'retirement' | 'wedding' | 'gadget' | 'custom';

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline?: string;
  icon: string;
  category: GoalCategory;
  color: string;
  /** Milestone percentages already celebrated */
  celebratedMilestones?: number[];
  /** Linked transaction IDs for auto-deduction tracking */
  linkedTransactionIds?: string[];
  /** Contribution history */
  contributions?: GoalContribution[];
  createdAt: string;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  source: 'manual' | 'transaction';
  label?: string;
}

