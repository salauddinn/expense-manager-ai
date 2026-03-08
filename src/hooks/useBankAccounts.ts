import { useLocalStorage } from './useLocalStorage';
import { BankAccount } from '@/types/finance';
import { useCallback } from 'react';

export function useBankAccounts() {
  const [accounts, setAccounts] = useLocalStorage<BankAccount[]>('finance_bank_accounts', []);

  const addAccount = useCallback((a: Omit<BankAccount, 'id'>) => {
    const n: BankAccount = { ...a, id: crypto.randomUUID() };
    setAccounts((prev) => [...prev, n]);
    return n;
  }, [setAccounts]);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, [setAccounts]);

  const updateAccount = useCallback((id: string, updates: Partial<BankAccount>) => {
    setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, ...updates } : a));
  }, [setAccounts]);

  return { accounts, addAccount, deleteAccount, updateAccount };
}
