export type TransactionType = 'income' | 'expense';

export type CategoryType =
  | 'food' | 'transport' | 'shopping' | 'bills' | 'entertainment'
  | 'health' | 'education' | 'rent' | 'groceries' | 'travel'
  | 'salary' | 'freelance' | 'investment' | 'gift' | 'refund' | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: CategoryType;
  description: string;
  date: string; // ISO string
  receiptUrl?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'savings' | 'current' | 'salary';
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
  rate: number; // annual %
  tenureMonths: number;
  startDate: string;
  currency: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'property' | 'investment' | 'vehicle' | 'other';
  value: number;
  currency: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  parsedTransaction?: Partial<Transaction>;
  confirmed?: boolean;
}
