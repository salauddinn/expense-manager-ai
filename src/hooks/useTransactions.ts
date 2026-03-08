import { useSupabaseCrud } from './useSupabaseCrud';
import { Transaction } from '@/types/finance';
import { useCallback } from 'react';

export function useTransactions() {
  const { items: transactions, isLoading, add, remove, update } = useSupabaseCrud<Transaction>('transactions');

  const addTransaction = useCallback(
    (t: Omit<Transaction, 'id' | 'createdAt'>) => {
      return add({ ...t, createdAt: new Date().toISOString() } as Omit<Transaction, 'id'>);
    },
    [add],
  );

  return {
    transactions,
    isLoading,
    addTransaction,
    deleteTransaction: remove,
    updateTransaction: update,
  };
}
