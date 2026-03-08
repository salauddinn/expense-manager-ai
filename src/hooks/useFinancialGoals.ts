import { useLocalStorage } from './useLocalStorage';
import { FinancialGoal, GoalCategory, GoalContribution } from '@/types/finance';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

export const GOAL_CATEGORIES: { value: GoalCategory; label: string; icon: string; color: string }[] = [
  { value: 'emergency', label: 'Emergency Fund', icon: '🚨', color: 'hsl(0, 72%, 51%)' },
  { value: 'travel', label: 'Travel', icon: '✈️', color: 'hsl(190, 70%, 45%)' },
  { value: 'education', label: 'Education', icon: '📚', color: 'hsl(230, 75%, 58%)' },
  { value: 'home', label: 'Home', icon: '🏠', color: 'hsl(38, 92%, 50%)' },
  { value: 'retirement', label: 'Retirement', icon: '🏖️', color: 'hsl(152, 60%, 38%)' },
  { value: 'wedding', label: 'Wedding', icon: '💍', color: 'hsl(330, 65%, 50%)' },
  { value: 'gadget', label: 'Gadget', icon: '💻', color: 'hsl(280, 60%, 55%)' },
  { value: 'custom', label: 'Custom', icon: '🎯', color: 'hsl(200, 70%, 50%)' },
];

export function getGoalCategoryInfo(cat: GoalCategory) {
  return GOAL_CATEGORIES.find((c) => c.value === cat) ?? GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1];
}

const MILESTONES = [25, 50, 75, 100];

export function useFinancialGoals() {
  const [goals, setGoals] = useLocalStorage<FinancialGoal[]>('finance_goals', []);

  const addGoal = useCallback((goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'currentAmount' | 'celebratedMilestones' | 'linkedTransactionIds'>) => {
    const n: FinancialGoal = {
      ...goal,
      id: crypto.randomUUID(),
      currentAmount: 0,
      celebratedMilestones: [],
      linkedTransactionIds: [],
      createdAt: new Date().toISOString(),
    };
    logger.info('[Goals] Created goal', n.name);
    analytics.track('goal_created', { category: n.category, target: n.targetAmount });
    setGoals((prev) => [...prev, n]);
    return n;
  }, [setGoals]);

  const addContribution = useCallback((id: string, amount: number): { newMilestones: number[] } => {
    let newMilestones: number[] = [];

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newAmount = Math.min(g.currentAmount + amount, g.targetAmount);
        const pct = (newAmount / g.targetAmount) * 100;
        const celebrated = g.celebratedMilestones ?? [];
        const freshMilestones = MILESTONES.filter((m) => pct >= m && !celebrated.includes(m));
        newMilestones = freshMilestones;

        logger.info('[Goals] Contribution added', { id, amount, newPct: Math.round(pct) });
        if (freshMilestones.length > 0) {
          analytics.track('goal_milestone', { id, milestones: freshMilestones.join(',') });
        }

        return {
          ...g,
          currentAmount: newAmount,
          celebratedMilestones: [...celebrated, ...freshMilestones],
        };
      })
    );

    return { newMilestones };
  }, [setGoals]);

  /** Link a transaction to a goal and auto-add its amount as a contribution */
  const linkTransaction = useCallback((goalId: string, transactionId: string, amount: number): { newMilestones: number[] } => {
    let newMilestones: number[] = [];

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const linked = g.linkedTransactionIds ?? [];
        if (linked.includes(transactionId)) return g; // Already linked

        const newAmount = Math.min(g.currentAmount + amount, g.targetAmount);
        const pct = (newAmount / g.targetAmount) * 100;
        const celebrated = g.celebratedMilestones ?? [];
        const freshMilestones = MILESTONES.filter((m) => pct >= m && !celebrated.includes(m));
        newMilestones = freshMilestones;

        logger.info('[Goals] Transaction linked', { goalId, transactionId, amount });

        return {
          ...g,
          currentAmount: newAmount,
          linkedTransactionIds: [...linked, transactionId],
          celebratedMilestones: [...celebrated, ...freshMilestones],
        };
      })
    );

    return { newMilestones };
  }, [setGoals]);

  const deleteGoal = useCallback((id: string) => {
    logger.info('[Goals] Deleted goal', id);
    analytics.track('goal_deleted');
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, [setGoals]);

  return { goals, addGoal, addContribution, linkTransaction, deleteGoal };
}
