import { useSupabaseCrud } from './useSupabaseCrud';
import { RecurringTransaction, RecurringFrequency, CategoryType, TransactionType } from '@/types/finance';
import { useCallback } from 'react';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

function getNextDate(currentDate: string, frequency: RecurringFrequency): string {
  const date = new Date(currentDate);
  let next: Date;
  switch (frequency) {
    case 'daily': next = addDays(date, 1); break;
    case 'weekly': next = addWeeks(date, 1); break;
    case 'monthly': next = addMonths(date, 1); break;
    case 'yearly': next = addYears(date, 1); break;
    default: next = addMonths(date, 1);
  }
  return format(next, 'yyyy-MM-dd');
}

export function useRecurringTransactions() {
  const { items: recurringTransactions, isLoading, add, remove, update } = useSupabaseCrud<RecurringTransaction>('recurring_transactions');

  const addRecurring = useCallback(
    (data: {
      type: TransactionType;
      amount: number;
      currency: string;
      category: CategoryType;
      description: string;
      frequency: RecurringFrequency;
      startDate: string;
      endDate?: string;
      linkedAccountId?: string;
      linkedCardId?: string;
    }) => {
      return add({
        ...data,
        nextDate: data.startDate,
        isActive: true,
        createdAt: new Date().toISOString(),
      } as Omit<RecurringTransaction, 'id'>);
    },
    [add],
  );

  const toggleActive = useCallback(
    (id: string, isActive: boolean) => update(id, { isActive }),
    [update],
  );

  const advanceNextDate = useCallback(
    (id: string, currentNextDate: string, frequency: RecurringFrequency) => {
      const nextDate = getNextDate(currentNextDate, frequency);
      return update(id, { nextDate });
    },
    [update],
  );

  return {
    recurringTransactions,
    isLoading,
    addRecurring,
    deleteRecurring: remove,
    toggleActive,
    advanceNextDate,
    updateRecurring: update,
  };
}

export { getNextDate };
