import { useLocalStorage } from './useLocalStorage';
import { Transaction } from '@/types/finance';
import { useCallback } from 'react';

export function useTransactions() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('finance_transactions', []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTransactions((prev) => [newT, ...prev]);
    return newT;
  }, [setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, [setTransactions]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  }, [setTransactions]);

  return { transactions, addTransaction, deleteTransaction, updateTransaction };
}
