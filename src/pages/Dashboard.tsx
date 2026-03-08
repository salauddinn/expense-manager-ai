/**
 * Dashboard — Financial overview with net worth, stats, chart, and recent transactions.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertsBanner } from '@/components/AlertsBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionRow } from '@/components/TransactionRow';
import { Section } from '@/components/shared/Section';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { useAssets } from '@/hooks/useAssets';
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
import { TrendingUp, TrendingDown, ArrowUpRight, MessageSquare, RotateCcw } from 'lucide-react';

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

const ACCENT_BORDER: Record<string, string> = {
  primary: 'accent-border-primary',
  destructive: 'accent-border-destructive',
  success: 'accent-border-success',
  warning: 'accent-border-warning',
};

const VALUE_COLOR: Record<string, string> = {
  destructive: 'text-destructive',
};

export default function Dashboard() {
  const { transactions } = useTransactions();
  const { accounts } = useBankAccounts();
  const { cards } = useCreditCards();
  const { loans } = useLoans();
  const { assets } = useAssets();

  // Use primary currency from first account, or default
  const primaryCurrency = accounts[0]?.currency ?? DEFAULT_CURRENCY;

  const totalBankBalance = sumBy(accounts, (a) => a.balance);
  const totalCreditDebt = sumBy(cards, (c) => c.outstanding);
  const totalLoanOutstanding = sumBy(loans, (l) => l.principal);
  const totalAssetValue = sumBy(assets, (a) => a.value);
  const netWorth = totalBankBalance + totalAssetValue - totalCreditDebt - totalLoanOutstanding;
  const totalCashback = sumBy(transactions, (t) => t.cashback ?? 0);

  const chartData = useMemo(() => getMonthlyChartData(transactions), [transactions]);
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

      {/* Alerts */}
      <AlertsBanner />

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
        {totalCashback > 0 && (
          <StatCard title="Cashback Earned" value={formatCurrency(totalCashback, primaryCurrency)} accent="success" />
        )}
      </div>

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
                  />
                  <Bar dataKey="income" fill="hsl(var(--success))" radius={[6, 6, 6, 6]} />
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[6, 6, 6, 6]} opacity={0.7} />
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
    </AppLayout>
  );
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className={ACCENT_BORDER[accent] ?? ''}>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{title}</p>
        <p className={`text-xl font-bold tracking-tight ${VALUE_COLOR[accent] ?? 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
