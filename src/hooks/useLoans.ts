import { useSupabaseCrud } from './useSupabaseCrud';
import { Loan } from '@/types/finance';

export function useLoans() {
  const { items: loans, isLoading, add, remove, update } = useSupabaseCrud<Loan>('loans');
  return {
    loans,
    isLoading,
    addLoan: add,
    deleteLoan: remove,
    updateLoan: update,
  };
}
