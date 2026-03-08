/**
 * LLM Settings hook — stores API key and provider in localStorage.
 */

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
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

export function useLLMSettings() {
  const [settings, setSettings] = useLocalStorage<LLMSettings>(
    'finance_llm_settings',
    DEFAULT_SETTINGS,
  );

  const isConfigured = !!settings.apiKey.trim();

  const updateSettings = useCallback((updates: Partial<LLMSettings>) => {
    logger.info('[LLMSettings] Updated', Object.keys(updates));
    if (updates.provider) analytics.track('llm_provider_changed', { provider: updates.provider });
    if (updates.model) analytics.track('llm_model_changed', { model: updates.model });
    if (updates.apiKey !== undefined) analytics.track('llm_apikey_updated', { hasKey: !!updates.apiKey.trim() });
    setSettings((prev) => ({ ...prev, ...updates }));
  }, [setSettings]);

  const clearApiKey = useCallback(() => {
    logger.info('[LLMSettings] API key cleared');
    analytics.track('llm_apikey_cleared');
    setSettings((prev) => ({ ...prev, apiKey: '' }));
  }, [setSettings]);

  return { settings, isConfigured, updateSettings, clearApiKey };
}
