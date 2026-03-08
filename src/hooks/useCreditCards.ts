import { useLocalStorage } from './useLocalStorage';
import { CreditCard } from '@/types/finance';
import { useCallback } from 'react';

export function useCreditCards() {
  const [cards, setCards] = useLocalStorage<CreditCard[]>('finance_credit_cards', []);

  const addCard = useCallback((c: Omit<CreditCard, 'id'>) => {
    const n: CreditCard = { ...c, id: crypto.randomUUID() };
    setCards((prev) => [...prev, n]);
    return n;
  }, [setCards]);

  const deleteCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, [setCards]);

  const updateCard = useCallback((id: string, updates: Partial<CreditCard>) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, [setCards]);

  return { cards, addCard, deleteCard, updateCard };
}
