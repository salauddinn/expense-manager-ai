/**
 * AlertsBanner — Shows in-app alerts for budget limits and bill reminders.
 * Renders at the top of the Dashboard.
 */

import { useMemo } from 'react';
import { useBudgetGoals } from '@/hooks/useBudgetGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { getCategoryInfo } from '@/lib/categories';
import { formatCurrency } from '@/lib/currencies';
import { CategoryType } from '@/types/finance';
import { calculateEMI } from '@/lib/loanCalculator';
import { startOfMonth, endOfMonth, isWithinInterval, differenceInDays, parseISO, isValid } from 'date-fns';
import { AlertTriangle, CreditCard, Receipt } from 'lucide-react';

interface Alert {
  id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'bill_due' | 'loan_emi';
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: 'warning' | 'destructive' | 'default';
}

export function AlertsBanner() {
  const { goals } = useBudgetGoals();
  const { transactions } = useTransactions();
  const { cards } = useCreditCards();
  const { loans } = useLoans();

  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Budget alerts
    goals.forEach((goal) => {
      const spent = transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.category === goal.category &&
            isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
        )
        .reduce((s, t) => s + t.amount, 0);

      const pct = (spent / goal.monthlyLimit) * 100;
      const cat = getCategoryInfo(goal.category as CategoryType);

      if (pct >= 100) {
        result.push({
          id: `budget-exceeded-${goal.id}`,
          type: 'budget_exceeded',
          icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
          title: `${cat.icon} ${cat.label} budget exceeded`,
          description: `Spent ${formatCurrency(spent, goal.currency)} of ${formatCurrency(goal.monthlyLimit, goal.currency)} limit`,
          variant: 'destructive',
        });
      } else if (pct >= 80) {
        result.push({
          id: `budget-warning-${goal.id}`,
          type: 'budget_warning',
          icon: <AlertTriangle className="h-4 w-4 text-warning" />,
          title: `${cat.icon} ${cat.label} budget at ${Math.round(pct)}%`,
          description: `${formatCurrency(goal.monthlyLimit - spent, goal.currency)} remaining`,
          variant: 'warning',
        });
      }
    });

    // Credit card due date alerts
    cards.forEach((card) => {
      if (!card.dueDate || card.outstanding <= 0) return;
      const dueDate = parseISO(card.dueDate);
      if (!isValid(dueDate)) return;
      const daysUntilDue = differenceInDays(dueDate, now);

      if (daysUntilDue >= 0 && daysUntilDue <= 7) {
        result.push({
          id: `card-due-${card.id}`,
          type: 'bill_due',
          icon: <CreditCard className="h-4 w-4 text-primary" />,
          title: `${card.name} payment due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}`,
          description: `Outstanding: ${formatCurrency(card.outstanding, card.currency)}`,
          variant: 'default',
        });
      } else if (daysUntilDue < 0 && daysUntilDue >= -30) {
        result.push({
          id: `card-overdue-${card.id}`,
          type: 'bill_due',
          icon: <CreditCard className="h-4 w-4 text-destructive" />,
          title: `${card.name} payment overdue!`,
          description: `${formatCurrency(card.outstanding, card.currency)} was due ${Math.abs(daysUntilDue)} days ago`,
          variant: 'destructive',
        });
      }
    });

    // Loan EMI reminders (show if loan exists)
    loans.forEach((loan) => {
      const emi = calculateEMI(loan.principal, loan.rate, loan.tenureMonths);
      result.push({
        id: `loan-emi-${loan.id}`,
        type: 'loan_emi',
        icon: <Receipt className="h-4 w-4 text-warning" />,
        title: `${loan.name} EMI`,
        description: `Monthly: ${formatCurrency(emi.emi, loan.currency)}`,
        variant: 'default',
      });
    });

    return result;
  }, [goals, transactions, cards, loans]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-5">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
            alert.variant === 'destructive'
              ? 'bg-destructive/8 border border-destructive/20'
              : alert.variant === 'warning'
              ? 'bg-warning/8 border border-warning/20'
              : 'bg-primary/5 border border-primary/15'
          }`}
        >
          <div className="mt-0.5 shrink-0">{alert.icon}</div>
          <div>
            <p className="font-semibold text-xs">{alert.title}</p>
            <p className="text-[11px] text-muted-foreground">{alert.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
