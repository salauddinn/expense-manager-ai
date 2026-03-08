import { useLocalStorage } from './useLocalStorage';
import { BudgetGoal, CategoryType } from '@/types/finance';
import { useCallback } from 'react';

export function useBudgetGoals() {
  const [goals, setGoals] = useLocalStorage<BudgetGoal[]>('finance_budget_goals', []);

  const addGoal = useCallback((category: CategoryType, monthlyLimit: number, currency: string = 'INR') => {
    setGoals((prev) => {
      const exists = prev.some((g) => g.category === category);
      if (exists) {
        return prev.map((g) => g.category === category ? { ...g, monthlyLimit, currency } : g);
      }
      return [...prev, { id: crypto.randomUUID(), category, monthlyLimit, currency }];
    });
  }, [setGoals]);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, [setGoals]);

  return { goals, addGoal, deleteGoal };
}
