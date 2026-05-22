/**
 * LLM Settings hook.
 * - provider + model stored in Supabase (llm_settings table)
 * - apiKey stored only in localStorage (never sent to DB)
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from './useLocalStorage';
import { supabase } from '@/lib/supabase';
import { LLM_SETTINGS_STORAGE_KEY } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

export type LLMProvider = 'openai' | 'google';

export interface LLMSettings {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

const DEFAULT_SETTINGS: LLMSettings = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
};

export const PROVIDER_MODELS: Record<LLMProvider, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (fast & cheap)' },
    { value: 'gpt-4o', label: 'GPT-4o (best quality)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (legacy)' },
  ],
  google: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (fast)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (balanced)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (best)' },
  ],
};

const QUERY_KEY = ['llm_settings'];

export function useLLMSettings() {
  const queryClient = useQueryClient();

  // API key stays local only — never persisted to DB
  const [apiKey, setApiKey] = useLocalStorage<string>(LLM_SETTINGS_STORAGE_KEY, '');

  const { data: dbSettings } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await supabase.from('llm_settings').select('provider, model').maybeSingle();
      return data as { provider: LLMProvider; model: string } | null;
    },
  });

  const settings: LLMSettings = {
    provider: dbSettings?.provider ?? DEFAULT_SETTINGS.provider,
    model: dbSettings?.model ?? DEFAULT_SETTINGS.model,
    apiKey,
  };

  const isConfigured = !!apiKey.trim();

  const updateSettings = useCallback(
    async (updates: Partial<LLMSettings>) => {
      logger.info('[LLMSettings] Updated', Object.keys(updates));

      if (updates.apiKey !== undefined) {
        setApiKey(updates.apiKey);
        analytics.track('llm_apikey_updated', { hasKey: !!updates.apiKey.trim() });
      }

      const dbUpdates: Record<string, unknown> = {};
      if (updates.provider) {
        dbUpdates.provider = updates.provider;
        analytics.track('llm_provider_changed', { provider: updates.provider });
      }
      if (updates.model) {
        dbUpdates.model = updates.model;
        analytics.track('llm_model_changed', { model: updates.model });
      }

      if (Object.keys(dbUpdates).length > 0) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        dbUpdates.user_id = session?.user?.id;
        await supabase.from('llm_settings').upsert(dbUpdates, { onConflict: 'user_id' });
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
    [setApiKey, queryClient],
  );

  const clearApiKey = useCallback(() => {
    logger.info('[LLMSettings] API key cleared');
    analytics.track('llm_apikey_cleared');
    setApiKey('');
  }, [setApiKey]);

  return { settings, isConfigured, updateSettings, clearApiKey };
}
