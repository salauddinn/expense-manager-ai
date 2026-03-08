/**
 * Dashboard — Financial overview with net worth, stats, chart, and recent transactions.
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { useAssets } from '@/hooks/useAssets';
import { formatCurrency } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  format, subMonths, startOfMonth, endOfMonth, isWithinInterval,
} from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Transaction } from '@/types/finance';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function sumBy<T>(items: T[], getter: (item: T) => number): number {
  return items.reduce((total, item) => total + getter(item), 0);
}

function getMonthlyChartData(transactions: Transaction[]) {
  return Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const monthTxns = transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start, end }),
    );
    return {
      name: format(date, 'MMM'),
      income: sumBy(monthTxns.filter((t) => t.type === 'income'), (t) => t.amount),
      expense: sumBy(monthTxns.filter((t) => t.type === 'expense'), (t) => t.amount),
    };
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { transactions } = useTransactions();
  const { accounts } = useBankAccounts();
  const { cards } = useCreditCards();
  const { loans } = useLoans();
  const { assets } = useAssets();

  const totalBankBalance = sumBy(accounts, (a) => a.balance);
  const totalCreditDebt = sumBy(cards, (c) => c.outstanding);
  const totalLoanOutstanding = sumBy(loans, (l) => l.principal);
  const totalAssetValue = sumBy(assets, (a) => a.value);
  const netWorth = totalBankBalance + totalAssetValue - totalCreditDebt - totalLoanOutstanding;

  const chartData = useMemo(() => getMonthlyChartData(transactions), [transactions]);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <AppLayout>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">{getGreeting()}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Net Worth */}
      <Card className="mb-6">
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Net Worth</p>
          <p className={`text-3xl font-semibold tracking-tight ${netWorth >= 0 ? 'text-foreground' : 'text-destructive'}`}>
            {netWorth < 0 && '−'}{formatCurrency(Math.abs(netWorth), 'INR')}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Bank Balance" value={formatCurrency(totalBankBalance, 'INR')} />
        <StatCard label="Credit Debt" value={formatCurrency(totalCreditDebt, 'INR')} variant="destructive" />
        <StatCard label="Assets" value={formatCurrency(totalAssetValue, 'INR')} />
        <StatCard label="Loans" value={formatCurrency(totalLoanOutstanding, 'INR')} />
      </div>

      {/* Income vs Expenses Chart */}
      <div className="mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Income vs Expenses</h2>
        <Card>
          <CardContent className="pt-4 pb-2">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      color: 'hsl(var(--foreground))',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--success))" radius={[6, 6, 6, 6]} />
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[6, 6, 6, 6]} opacity={0.75} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Recent Transactions</h2>
        <Card>
          <CardContent className="py-1">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No transactions yet. Use Chat to add one.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recentTransactions.map((t) => (
                  <TransactionRow key={t.id} transaction={t} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

// ────────────────────────────────────────────────────────────────
// Sub-Components
// ────────────────────────────────────────────────────────────────

function StatCard({ label, value, variant }: { label: string; value: string; variant?: 'destructive' }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-[11px] font-medium text-muted-foreground mb-1">{label}</p>
        <p className={`text-lg font-semibold tracking-tight ${variant === 'destructive' ? 'text-destructive' : 'text-foreground'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function TransactionRow({ transaction: t }: { transaction: Transaction }) {
  const category = getCategoryInfo(t.category);

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg">{category.icon}</span>
        <div>
          <p className="text-sm font-medium line-clamp-1">{t.description}</p>
          <p className="text-[11px] text-muted-foreground">
            {format(new Date(t.date), 'dd MMM yyyy')}
          </p>
        </div>
      </div>
      <p
        className={`text-sm font-medium tabular-nums ${
          t.type === 'income' ? 'text-success' : 'text-destructive'
        }`}
      >
        {t.type === 'income' ? '+' : '−'}
        {formatCurrency(t.amount, t.currency)}
      </p>
    </div>
  );
}
