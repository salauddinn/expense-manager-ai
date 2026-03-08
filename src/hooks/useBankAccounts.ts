import { useSupabaseCrud } from './useSupabaseCrud';
import { BankAccount } from '@/types/finance';

export function useBankAccounts() {
  const { items: accounts, isLoading, add, remove, update } = useSupabaseCrud<BankAccount>('bank_accounts');
  return {
    accounts,
    isLoading,
    addAccount: add,
    deleteAccount: remove,
    updateAccount: update,
  };
}
