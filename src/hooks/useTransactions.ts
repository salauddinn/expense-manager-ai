import { useLocalCrud } from './useLocalCrud';
import { Transaction } from '@/types/finance';
import { useCallback } from 'react';

export function useTransactions() {
  const { items: transactions, add, remove, update, setItems } = useLocalCrud<Transaction>('finance_transactions');

  const addTransaction = useCallback(
    (t: Omit<Transaction, 'id' | 'createdAt'>) => {
      const newT = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as Transaction;
      setItems((prev) => [newT, ...prev]);
      return newT;
    },
    [setItems],
  );

  return {
    transactions,
    addTransaction,
    deleteTransaction: remove,
    updateTransaction: update,
  };
}
