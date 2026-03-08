/**
 * Dashboard — Financial overview with glass hero, accent cards, chart, transactions.
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
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

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
        <h1 className="text-xl font-bold text-foreground tracking-tight">{getGreeting()}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMMM')}</p>
      </div>

      {/* Net Worth — Flat card with accent bar */}
      <Card className="mb-6 accent-border-primary border-l-4">
        <CardContent className="py-5 px-5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Net Worth</p>
          <p className={`text-4xl font-extrabold tracking-tight ${netWorth >= 0 ? 'text-foreground' : 'text-destructive'}`}>
            {netWorth < 0 && '−'}{formatCurrency(Math.abs(netWorth), 'INR')}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {netWorth >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground">
              {netWorth >= 0 ? 'Looking good' : 'Negative net worth'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats — Accent bordered cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="accent-border-primary">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Bank Balance</p>
            <p className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(totalBankBalance, 'INR')}</p>
          </CardContent>
        </Card>
        <Card className="accent-border-destructive">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Credit Debt</p>
            <p className="text-xl font-bold tracking-tight text-destructive">{formatCurrency(totalCreditDebt, 'INR')}</p>
          </CardContent>
        </Card>
        <Card className="accent-border-success">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Assets</p>
            <p className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(totalAssetValue, 'INR')}</p>
          </CardContent>
        </Card>
        <Card className="accent-border-warning">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Loans</p>
            <p className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(totalLoanOutstanding, 'INR')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses Chart */}
      <div className="mb-6">
        <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Income vs Expenses</h2>
        <Card>
          <CardContent className="pt-4 pb-2">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4} barSize={16}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--success))" radius={[6, 6, 6, 6]} />
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[6, 6, 6, 6]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Transactions</h2>
          {recentTransactions.length > 0 && (
            <a href="/transactions" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>
        <Card>
          <CardContent className="py-1 px-4">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
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

function TransactionRow({ transaction: t }: { transaction: Transaction }) {
  const category = getCategoryInfo(t.category);
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-base">
          {category.icon}
        </div>
        <div>
          <p className="text-sm font-semibold line-clamp-1">{t.description}</p>
          <p className="text-[11px] text-muted-foreground">
            {format(new Date(t.date), 'dd MMM yyyy')}
          </p>
        </div>
      </div>
      <p className={`text-sm font-bold tabular-nums ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
        {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount, t.currency)}
      </p>
    </div>
  );
}
