// @refresh reset
import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        logger.debug(`[Storage] Loaded "${key}"`, JSON.parse(item).length ?? 'value');
        return JSON.parse(item);
      }
      return initialValue;
    } catch (err) {
      logger.error(`[Storage] Failed to parse "${key}"`, err);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (err) {
        logger.error(`[Storage] Failed to save "${key}"`, err);
      }
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue] as const;
}
