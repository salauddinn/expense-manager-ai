/**
 * Shared TransactionRow component used across Dashboard, Transactions, and AccountDetail pages.
 */

import { Transaction } from '@/types/finance';
import { getCategoryInfo } from '@/lib/categories';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';

interface TransactionRowProps {
  transaction: Transaction;
  /** Override currency (e.g. from parent account). Falls back to transaction currency. */
  currency?: string;
  /** Show category icon. Defaults to true. */
  showIcon?: boolean;
  /** Content to render on the right side after the amount. */
  actions?: React.ReactNode;
  /** Click handler for the row. */
  onClick?: () => void;
}

export function TransactionRow({
  transaction: t,
  currency,
  showIcon = true,
  actions,
  onClick,
}: TransactionRowProps) {
  const displayCurrency = currency ?? t.currency;
  const category = getCategoryInfo(t.category);
  const isExpense = t.type === 'expense';

  return (
    <div
      className={`group flex items-center justify-between py-3.5 ${onClick ? 'cursor-pointer hover:bg-muted/50 -mx-4 px-4 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        {showIcon && (
          <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-base shrink-0">
            {category.icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{t.description || category.label}</p>
          <p className="text-[11px] text-muted-foreground">
            {category.label} · {format(new Date(t.date), 'dd MMM yyyy')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <p className={`text-sm font-bold tabular-nums ${isExpense ? 'text-destructive' : 'text-success'}`}>
          {isExpense ? '−' : '+'}{formatCurrency(t.amount, displayCurrency)}
        </p>
        {actions}
      </div>
    </div>
  );
}
