import { useLocalCrud } from './useLocalCrud';
import { Loan } from '@/types/finance';

export function useLoans() {
  const { items: loans, add, remove, update } = useLocalCrud<Loan>('finance_loans');
  return {
    loans,
    addLoan: add,
    deleteLoan: remove,
    updateLoan: update,
  };
}
