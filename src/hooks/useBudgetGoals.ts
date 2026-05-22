import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { BudgetGoal, CategoryType } from '@/types/finance';
import { supabase } from '@/lib/supabase';
import { toCamelCase } from '@/lib/dbMapper';
import { logger } from '@/lib/logger';

const QUERY_KEY = ['budget_goals'];

export function useBudgetGoals() {
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((row) => toCamelCase<BudgetGoal>(row as Record<string, unknown>));
    },
  });

  const addGoal = useCallback(
    async (category: CategoryType, monthlyLimit: number, currency: string = 'INR') => {
      logger.info('[BudgetGoals] Upsert', { category, monthlyLimit });
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { error } = await supabase
        .from('budget_goals')
        .upsert(
          { category, monthly_limit: monthlyLimit, currency, user_id: session?.user?.id },
          { onConflict: 'user_id,category' },
        );

      if (error) {
        logger.error('[BudgetGoals] Upsert error', error.message);
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    [queryClient],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      logger.info('[BudgetGoals] Delete', id);
      const { error } = await supabase.from('budget_goals').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    [queryClient],
  );

  return { goals, isLoading, addGoal, deleteGoal };
}
