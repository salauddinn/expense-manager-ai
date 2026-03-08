/**
 * Generic CRUD hook backed by Supabase.
 * Drop-in replacement for useLocalCrud with the same return interface.
 * Uses @tanstack/react-query for caching + optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toCamelCase, toSnakeCase } from '@/lib/dbMapper';
import { logger } from '@/lib/logger';

interface WithId {
  id: string;
}

export function useSupabaseCrud<T extends WithId>(tableName: string) {
  const queryClient = useQueryClient();
  const queryKey = [tableName];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error(`[SupabaseCrud] Fetch error on ${tableName}`, error.message);
        throw error;
      }

      return (data ?? []).map((row) => toCamelCase<T>(row as Record<string, unknown>));
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: Omit<T, 'id'>) => {
      const snakeItem = toSnakeCase(item as Record<string, unknown>);
      const { data, error } = await supabase
        .from(tableName)
        .insert(snakeItem)
        .select()
        .single();

      if (error) {
        logger.error(`[SupabaseCrud] Insert error on ${tableName}`, error.message);
        throw error;
      }

      return toCamelCase<T>(data as Record<string, unknown>);
    },
    onMutate: async (item: Omit<T, 'id'>) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<T[]>(queryKey) ?? [];
      const optimistic = { ...item, id: `optimistic-${Date.now()}` } as T;
      queryClient.setQueryData<T[]>(queryKey, [optimistic, ...prev]);
      return { prev };
    },
    onError: (_err, _item, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<T> }) => {
      const snakeUpdates = toSnakeCase(updates as Record<string, unknown>);
      const { data, error } = await supabase
        .from(tableName)
        .update(snakeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`[SupabaseCrud] Update error on ${tableName}`, error.message);
        throw error;
      }

      return toCamelCase<T>(data as Record<string, unknown>);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<T[]>(queryKey) ?? [];
      queryClient.setQueryData<T[]>(queryKey, prev.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) {
        logger.error(`[SupabaseCrud] Delete error on ${tableName}`, error.message);
        throw error;
      }
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<T[]>(queryKey) ?? [];
      queryClient.setQueryData<T[]>(queryKey, prev.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const add = useCallback(
    (item: Omit<T, 'id'>) => {
      logger.info(`[SupabaseCrud] Add to "${tableName}"`);
      return addMutation.mutateAsync(item);
    },
    [addMutation, tableName],
  );

  const update = useCallback(
    (id: string, updates: Partial<T>) => {
      logger.info(`[SupabaseCrud] Update in "${tableName}"`, id);
      return updateMutation.mutateAsync({ id, updates });
    },
    [updateMutation, tableName],
  );

  const remove = useCallback(
    (id: string) => {
      logger.info(`[SupabaseCrud] Remove from "${tableName}"`, id);
      return removeMutation.mutateAsync(id);
    },
    [removeMutation, tableName],
  );

  return { items, isLoading, add, update, remove };
}
