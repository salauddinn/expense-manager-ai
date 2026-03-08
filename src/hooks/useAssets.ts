import { useLocalCrud } from './useLocalCrud';
import { Asset } from '@/types/finance';

export function useAssets() {
  const { items: assets, add, remove, update } = useLocalCrud<Asset>('finance_assets');
  return {
    assets,
    addAsset: add,
    deleteAsset: remove,
    updateAsset: update,
  };
}
