import { useSupabaseCrud } from './useSupabaseCrud';
import { CreditCard } from '@/types/finance';

export function useCreditCards() {
  // DB column is 'credit_limit' but TypeScript type uses 'limit' — dbMapper handles this conversion
  const { items: cards, isLoading, add, remove, update } = useSupabaseCrud<CreditCard>('credit_cards');
  return {
    cards,
    isLoading,
    addCard: add,
    deleteCard: remove,
    updateCard: update,
  };
}
