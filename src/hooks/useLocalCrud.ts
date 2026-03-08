/**
 * Generic CRUD hook factory for localStorage-backed collections.
 *
 * Eliminates duplicate code across useAssets, useLoans, useBankAccounts, etc.
 */

import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';

interface WithId {
  id: string;
}

export function useLocalCrud<T extends WithId>(storageKey: string) {
  const [items, setItems] = useLocalStorage<T[]>(storageKey, []);

  const add = useCallback(
    (item: Omit<T, 'id'>) => {
      const newItem = { ...item, id: crypto.randomUUID() } as T;
      setItems((prev) => [...prev, newItem]);
      return newItem;
    },
    [setItems],
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [setItems],
  );

  const update = useCallback(
    (id: string, updates: Partial<T>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      );
    },
    [setItems],
  );

  return { items, add, remove, update, setItems };
}
