// @refresh reset
/**
 * Generic CRUD hook factory for localStorage-backed collections.
 */

import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';

interface WithId {
  id: string;
}

export function useLocalCrud<T extends WithId>(storageKey: string) {
  const [items, setItems] = useLocalStorage<T[]>(storageKey, []);

  const add = useCallback(
    (item: Omit<T, 'id'>) => {
      const newItem = { ...item, id: crypto.randomUUID() } as T;
      logger.info(`[CRUD] Add to "${storageKey}"`, newItem.id);
      setItems((prev) => [...prev, newItem]);
      return newItem;
    },
    [setItems, storageKey],
  );

  const remove = useCallback(
    (id: string) => {
      logger.info(`[CRUD] Remove from "${storageKey}"`, id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [setItems, storageKey],
  );

  const update = useCallback(
    (id: string, updates: Partial<T>) => {
      logger.info(`[CRUD] Update in "${storageKey}"`, id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      );
    },
    [setItems, storageKey],
  );

  return { items, add, remove, update, setItems };
}
