import { Transaction } from '@/types/finance';
import { format } from 'date-fns';
import { getCategoryInfo } from './categories';
import { triggerFileDownload } from './shared';
import { EXPORT_CSV_FILENAME_PREFIX } from './constants';
import { logger } from './logger';
import { analytics } from './analytics';

/** Generates a CSV file of the provided transactions and triggers a browser download. */
export function exportTransactionsCSV(transactions: Transaction[]) {
  logger.info('[Export] Generating CSV', { count: transactions.length });

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
  triggerFileDownload(blob, `${EXPORT_CSV_FILENAME_PREFIX}${format(new Date(), 'yyyy-MM-dd')}.csv`);

  analytics.track('csv_exported', { transactionCount: transactions.length });
  logger.info('[Export] CSV download triggered');
}
