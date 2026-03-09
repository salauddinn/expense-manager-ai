import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { FinancialGoal, GoalCategory, GoalContribution } from '@/types/finance';
import { supabase } from '@/lib/supabase';
import { toCamelCase } from '@/lib/dbMapper';
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

async function fetchGoalsWithContributions(): Promise<FinancialGoal[]> {
  const [goalsRes, contribsRes, linkedRes] = await Promise.all([
    supabase.from('financial_goals').select('*').order('created_at', { ascending: false }),
    supabase.from('goal_contributions').select('*').order('created_at', { ascending: true }),
    supabase.from('goal_linked_transactions').select('*'),
  ]);

  if (goalsRes.error) throw goalsRes.error;
  if (contribsRes.error) throw contribsRes.error;
  if (linkedRes.error) throw linkedRes.error;

  const contribs = (contribsRes.data ?? []);
  const linked = (linkedRes.data ?? []);

  return (goalsRes.data ?? []).map((row) => {
    const goal = toCamelCase<FinancialGoal>(row as Record<string, unknown>);
    goal.contributions = contribs
      .filter((c) => c.goal_id === goal.id)
      .map((c) => toCamelCase<GoalContribution>(c as Record<string, unknown>));
    goal.linkedTransactionIds = linked
      .filter((l) => l.goal_id === goal.id)
      .map((l) => l.transaction_id as string);
    return goal;
  });
}

export function useFinancialGoals() {
  const queryClient = useQueryClient();
  const queryKey = ['financial_goals'];

  const { data: goals = [] } = useQuery({
    queryKey,
    queryFn: fetchGoalsWithContributions,
  });

  const addGoal = useCallback(
    async (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'currentAmount' | 'celebratedMilestones' | 'linkedTransactionIds'>) => {
      logger.info('[Goals] Creating', goal.name);
      analytics.track('goal_created', { category: goal.category, target: goal.targetAmount });

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('financial_goals')
        .insert({
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: 0,
          currency: goal.currency,
          deadline: goal.deadline ?? null,
          icon: goal.icon,
          category: goal.category,
          color: goal.color,
          celebrated_milestones: [],
          user_id: session?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey });
      return toCamelCase<FinancialGoal>(data as Record<string, unknown>);
    },
    [queryClient],
  );

  const addContribution = useCallback(
    async (id: string, amount: number): Promise<{ newMilestones: number[] }> => {
      const goal = goals.find((g) => g.id === id);
      if (!goal) return { newMilestones: [] };

      const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
      const pct = (newAmount / goal.targetAmount) * 100;
      const celebrated = goal.celebratedMilestones ?? [];
      const freshMilestones = MILESTONES.filter((m) => pct >= m && !celebrated.includes(m));

      logger.info('[Goals] Contribution', { id, amount, pct: Math.round(pct) });
      if (freshMilestones.length > 0) {
        analytics.track('goal_milestone', { id, milestones: freshMilestones.join(',') });
      }

      const newCelebrated = [...celebrated, ...freshMilestones];

      const { data: { session } } = await supabase.auth.getSession();
      const [updateRes, contribRes] = await Promise.all([
        supabase
          .from('financial_goals')
          .update({ current_amount: newAmount, celebrated_milestones: newCelebrated })
          .eq('id', id),
        supabase.from('goal_contributions').insert({
          goal_id: id,
          amount,
          date: new Date().toISOString(),
          source: 'manual',
          user_id: session?.user?.id,
        }),
      ]);

      if (updateRes.error) throw updateRes.error;
      if (contribRes.error) throw contribRes.error;

      queryClient.invalidateQueries({ queryKey });
      return { newMilestones: freshMilestones };
    },
    [goals, queryClient],
  );

  const linkTransaction = useCallback(
    async (goalId: string, transactionId: string, amount: number, label?: string): Promise<{ newMilestones: number[] }> => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return { newMilestones: [] };

      const alreadyLinked = (goal.linkedTransactionIds ?? []).includes(transactionId);
      if (alreadyLinked) return { newMilestones: [] };

      const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
      const pct = (newAmount / goal.targetAmount) * 100;
      const celebrated = goal.celebratedMilestones ?? [];
      const freshMilestones = MILESTONES.filter((m) => pct >= m && !celebrated.includes(m));
      const newCelebrated = [...celebrated, ...freshMilestones];

      logger.info('[Goals] Link transaction', { goalId, transactionId, amount });

      const { data: { session } } = await supabase.auth.getSession();
      const [updateRes, contribRes, linkRes] = await Promise.all([
        supabase
          .from('financial_goals')
          .update({ current_amount: newAmount, celebrated_milestones: newCelebrated })
          .eq('id', goalId),
        supabase.from('goal_contributions').insert({
          goal_id: goalId,
          amount,
          date: new Date().toISOString(),
          source: 'transaction',
          label: label ?? null,
          transaction_id: transactionId,
          user_id: session?.user?.id,
        }),
        supabase.from('goal_linked_transactions').insert({
          goal_id: goalId,
          transaction_id: transactionId,
          user_id: session?.user?.id,
        }),
      ]);

      if (updateRes.error) throw updateRes.error;
      if (contribRes.error) throw contribRes.error;
      if (linkRes.error) throw linkRes.error;

      queryClient.invalidateQueries({ queryKey });
      return { newMilestones: freshMilestones };
    },
    [goals, queryClient],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      logger.info('[Goals] Deleted', id);
      analytics.track('goal_deleted');
      const { error } = await supabase.from('financial_goals').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey });
    },
    [queryClient],
  );

  return { goals, addGoal, addContribution, linkTransaction, deleteGoal };
}
