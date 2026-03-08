import { useSupabaseCrud } from './useSupabaseCrud';
import { Asset } from '@/types/finance';

export function useAssets() {
  const { items: assets, isLoading, add, remove, update } = useSupabaseCrud<Asset>('assets');
  return {
    assets,
    isLoading,
    addAsset: add,
    deleteAsset: remove,
    updateAsset: update,
  };
}
