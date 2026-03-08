import { useLocalCrud } from './useLocalCrud';
import { BankAccount } from '@/types/finance';

export function useBankAccounts() {
  const { items: accounts, add, remove, update } = useLocalCrud<BankAccount>('finance_bank_accounts');
  return {
    accounts,
    addAccount: add,
    deleteAccount: remove,
    updateAccount: update,
  };
}
