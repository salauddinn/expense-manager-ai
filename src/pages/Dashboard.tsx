/**
 * Dashboard — Financial overview with net worth, stats, chart, and recent transactions.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertsBanner } from '@/components/AlertsBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionRow } from '@/components/TransactionRow';
import { Section } from '@/components/shared/Section';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { useAssets } from '@/hooks/useAssets';
import { useDataMigration } from '@/hooks/useDataMigration';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currencies';
import { sumBy, CHART_TOOLTIP_STYLE } from '@/lib/shared';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  format, subMonths, startOfMonth, endOfMonth, isWithinInterval,
} from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Transaction } from '@/types/finance';
import { TrendingUp, TrendingDown, ArrowUpRight, MessageSquare, CloudUpload, X, Minus } from 'lucide-react';

function getMonthlyChartData(transactions: Transaction[]) {
  return Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const monthTxns = transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start, end }),
    );
    const income = sumBy(monthTxns.filter((t) => t.type === 'income'), (t) => t.amount);
    const expense = sumBy(monthTxns.filter((t) => t.type === 'expense'), (t) => t.amount);
    return {
      name: format(date, 'MMM'),
      income,
      expense,
      savings: Math.max(0, income - expense),
    };
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const ACCENT_BORDER: Record<string, string> = {
  primary: 'accent-border-primary',
  destructive: 'accent-border-destructive',
  success: 'accent-border-success',
  warning: 'accent-border-warning',
};

const VALUE_COLOR: Record<string, string> = {
  destructive: 'text-destructive',
  success: 'text-success',
};

export default function Dashboard() {
  const { transactions, isLoading: txLoading } = useTransactions();
  const { accounts, isLoading: accLoading } = useBankAccounts();
  const { cards, isLoading: cardLoading } = useCreditCards();
  const { loans, isLoading: loanLoading } = useLoans();
  const { assets, isLoading: assetLoading } = useAssets();
  const { showPrompt, isMigrating, runMigration, dismissMigration } = useDataMigration();

  const isLoading = txLoading || accLoading || cardLoading || loanLoading || assetLoading;

  const primaryCurrency = accounts[0]?.currency ?? DEFAULT_CURRENCY;

  const totalBankBalance = sumBy(accounts, (a) => a.balance);
  const totalCreditDebt = sumBy(cards, (c) => c.outstanding);
  const totalLoanOutstanding = sumBy(loans, (l) => l.principal);
  const totalAssetValue = sumBy(assets, (a) => a.value);
  const netWorth = totalBankBalance + totalAssetValue - totalCreditDebt - totalLoanOutstanding;
  const totalCashback = sumBy(transactions, (t) => t.cashback ?? 0);

  const chartData = useMemo(() => getMonthlyChartData(transactions), [transactions]);

  const { thisMonthIncome, thisMonthExpenses, savingsRate, spendingChange } = useMemo(() => {
    const now = new Date();
    const thisStart = startOfMonth(now);
    const thisEnd = endOfMonth(now);
    const lastStart = startOfMonth(subMonths(now, 1));
    const lastEnd = endOfMonth(subMonths(now, 1));

    const thisMonthIncome = sumBy(
      transactions.filter((t) => t.type === 'income' && isWithinInterval(new Date(t.date), { start: thisStart, end: thisEnd })),
      (t) => t.amount,
    );
    const thisMonthExpenses = sumBy(
      transactions.filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: thisStart, end: thisEnd })),
      (t) => t.amount,
    );
    const lastMonthExpenses = sumBy(
      transactions.filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: lastStart, end: lastEnd })),
      (t) => t.amount,
    );

    const savingsRate = thisMonthIncome > 0
      ? Math.round(((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100)
      : 0;
    const spendingChange = lastMonthExpenses > 0
      ? Math.round(((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100)
      : 0;

    return { thisMonthIncome, thisMonthExpenses, lastMonthExpenses, savingsRate, spendingChange };
  }, [transactions]);

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [transactions],
  );

  return (
    <AppLayout>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground tracking-tight">{getGreeting()}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMMM')}</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4 mb-6">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Data Migration Prompt */}
          {showPrompt && (
            <Card className="mb-4 border-primary/30 bg-primary/5">
              <CardContent className="py-4 px-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CloudUpload className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Migrate local data to cloud</p>
                    <p className="text-xs text-muted-foreground">We found existing data on this device. Move it to your account?</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" onClick={runMigration} disabled={isMigrating} className="rounded-full text-xs">
                    {isMigrating ? 'Migrating...' : 'Migrate'}
                  </Button>
                  <button onClick={dismissMigration} className="p-1 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerts */}
          <AlertsBanner />

          {/* Net Worth Card */}
          <Card className="mb-6 accent-border-primary border-l-4">
            <CardContent className="py-5 px-5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Net Worth</p>
              <p className={`text-4xl font-extrabold tracking-tight ${netWorth >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                {netWorth < 0 && '−'}{formatCurrency(Math.abs(netWorth), primaryCurrency)}
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard title="Bank Balance" value={formatCurrency(totalBankBalance, primaryCurrency)} accent="primary" />
            <StatCard title="Credit Debt" value={formatCurrency(totalCreditDebt, primaryCurrency)} accent="destructive" />
            <StatCard title="Assets" value={formatCurrency(totalAssetValue, primaryCurrency)} accent="success" />
            <StatCard title="Loans" value={formatCurrency(totalLoanOutstanding, primaryCurrency)} accent="warning" />
          </div>

          {/* This Month Summary */}
          {transactions.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card>
                <CardContent className="pt-3 pb-3 px-3">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 leading-tight">Income</p>
                  <p className="text-sm font-bold text-success tabular-nums">{formatCurrency(thisMonthIncome, primaryCurrency)}</p>
                  <p className="text-[9px] text-muted-foreground">this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 px-3">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 leading-tight">Spent</p>
                  <p className="text-sm font-bold text-destructive tabular-nums">{formatCurrency(thisMonthExpenses, primaryCurrency)}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {spendingChange > 0 ? (
                      <TrendingUp className="h-2.5 w-2.5 text-destructive" />
                    ) : spendingChange < 0 ? (
                      <TrendingDown className="h-2.5 w-2.5 text-success" />
                    ) : (
                      <Minus className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                    <span className={`text-[9px] font-medium ${spendingChange > 0 ? 'text-destructive' : spendingChange < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                      {spendingChange === 0 ? 'same' : `${Math.abs(spendingChange)}%`}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 px-3">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 leading-tight">Saved</p>
                  <p className={`text-sm font-bold tabular-nums ${savingsRate >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {savingsRate}%
                  </p>
                  <p className="text-[9px] text-muted-foreground">rate</p>
                </CardContent>
              </Card>
            </div>
          )}

          {totalCashback > 0 && (
            <Card className="mb-6 accent-border-success border-l-4">
              <CardContent className="py-3 px-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Cashback Earned</p>
                <p className="text-lg font-bold text-success tabular-nums">{formatCurrency(totalCashback, primaryCurrency)}</p>
              </CardContent>
            </Card>
          )}

          {/* Income vs Expenses Chart */}
          <Section title="Income vs Expenses">
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
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: number) => formatCurrency(value, primaryCurrency)}
                      />
                      <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[6, 6, 6, 6]} />
                      <Bar dataKey="expense" name="Expenses" fill="hsl(var(--destructive))" radius={[6, 6, 6, 6]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Transactions</h2>
              {recentTransactions.length > 0 && (
                <Link to="/transactions" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <Card>
              <CardContent className="py-1 px-4">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-6 w-6 opacity-30" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">No transactions yet</p>
                    <Link to="/chat">
                      <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
                        <MessageSquare className="h-3.5 w-3.5" /> Add via Chat
                      </Button>
                    </Link>
                  </div>
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
        </>
      )}
    </AppLayout>
  );
}

const StatCard = React.forwardRef<HTMLDivElement, { title: string; value: string; accent: string }>(
  ({ title, value, accent }, ref) => (
    <Card ref={ref} className={ACCENT_BORDER[accent] ?? ''}>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{title}</p>
        <p className={`text-xl font-bold tracking-tight ${VALUE_COLOR[accent] ?? 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
  ),
);
StatCard.displayName = 'StatCard';
