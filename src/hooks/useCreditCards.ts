import { useLocalCrud } from './useLocalCrud';
import { CreditCard } from '@/types/finance';

export function useCreditCards() {
  const { items: cards, add, remove, update } = useLocalCrud<CreditCard>('finance_credit_cards');
  return {
    cards,
    addCard: add,
    deleteCard: remove,
    updateCard: update,
  };
}
