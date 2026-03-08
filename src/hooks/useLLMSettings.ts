/**
 * LLM Settings hook — stores API key and provider in localStorage.
 * The user provides their own API key (stored only in their browser).
 */

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

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

  const updateSettings = (updates: Partial<LLMSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const clearApiKey = () => {
    setSettings((prev) => ({ ...prev, apiKey: '' }));
  };

  return { settings, isConfigured, updateSettings, clearApiKey };
}
