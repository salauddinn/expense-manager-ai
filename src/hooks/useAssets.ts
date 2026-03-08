import { useLocalStorage } from './useLocalStorage';
import { Asset } from '@/types/finance';
import { useCallback } from 'react';

export function useAssets() {
  const [assets, setAssets] = useLocalStorage<Asset[]>('finance_assets', []);

  const addAsset = useCallback((a: Omit<Asset, 'id'>) => {
    const n: Asset = { ...a, id: crypto.randomUUID() };
    setAssets((prev) => [...prev, n]);
    return n;
  }, [setAssets]);

  const deleteAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }, [setAssets]);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets((prev) => prev.map((a) => a.id === id ? { ...a, ...updates } : a));
  }, [setAssets]);

  return { assets, addAsset, deleteAsset, updateAsset };
}
