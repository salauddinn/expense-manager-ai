import { Transaction } from '@/types/finance';
import { format } from 'date-fns';
import { getCategoryInfo } from './categories';

export function exportTransactionsCSV(transactions: Transaction[]) {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency'];
  const rows = transactions.map((t) => [
    format(new Date(t.date), 'yyyy-MM-dd'),
    t.type,
    getCategoryInfo(t.category).label,
    `"${t.description.replace(/"/g, '""')}"`,
    t.amount.toString(),
    t.currency,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
