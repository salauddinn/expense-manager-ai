import { useLocalStorage } from './useLocalStorage';
import { Loan } from '@/types/finance';
import { useCallback } from 'react';

export function useLoans() {
  const [loans, setLoans] = useLocalStorage<Loan[]>('finance_loans', []);

  const addLoan = useCallback((l: Omit<Loan, 'id'>) => {
    const n: Loan = { ...l, id: crypto.randomUUID() };
    setLoans((prev) => [...prev, n]);
    return n;
  }, [setLoans]);

  const deleteLoan = useCallback((id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
  }, [setLoans]);

  const updateLoan = useCallback((id: string, updates: Partial<Loan>) => {
    setLoans((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
  }, [setLoans]);

  return { loans, addLoan, deleteLoan, updateLoan };
}
