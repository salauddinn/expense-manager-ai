import { useLocalStorage } from './useLocalStorage';
import { BudgetGoal, CategoryType } from '@/types/finance';
import { useCallback } from 'react';

export function useBudgetGoals() {
  const [goals, setGoals] = useLocalStorage<BudgetGoal[]>('finance_budget_goals', []);

  const addGoal = useCallback((category: CategoryType, monthlyLimit: number, currency: string = 'INR') => {
    const existing = goals.find((g) => g.category === category);
    if (existing) {
      setGoals((prev) => prev.map((g) => g.category === category ? { ...g, monthlyLimit, currency } : g));
    } else {
      setGoals((prev) => [...prev, { id: crypto.randomUUID(), category, monthlyLimit, currency }]);
    }
  }, [goals, setGoals]);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, [setGoals]);

  return { goals, addGoal, deleteGoal };
}
