import { useLocalStorage } from './useLocalStorage';
import { FinancialGoal } from '@/types/finance';
import { useCallback } from 'react';

export function useFinancialGoals() {
  const [goals, setGoals] = useLocalStorage<FinancialGoal[]>('finance_goals', []);

  const addGoal = useCallback((goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'currentAmount'>) => {
    const n: FinancialGoal = {
      ...goal,
      id: crypto.randomUUID(),
      currentAmount: 0,
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [...prev, n]);
    return n;
  }, [setGoals]);

  const addContribution = useCallback((id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) }
          : g
      )
    );
  }, [setGoals]);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, [setGoals]);

  return { goals, addGoal, addContribution, deleteGoal };
}
