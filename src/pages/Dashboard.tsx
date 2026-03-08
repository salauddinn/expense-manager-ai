/**
 * Dashboard — Financial overview with net worth, stats, chart, and recent transactions.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { useAssets } from '@/hooks/useAssets';
import { formatCurrency } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import { Landmark, CreditCard, PiggyBank, Receipt } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { transactions } = useTransactions();
  const { accounts } = useBankAccounts();
  const { cards } = useCreditCards();
  const { loans } = useLoans();
  const { assets } = useAssets();

  // Computed totals
  const totalBankBalance = sumBy(accounts, (a) => a.balance);
  const totalCreditDebt = sumBy(cards, (c) => c.outstanding);
  const totalLoanOutstanding = sumBy(loans, (l) => l.principal);
  const totalAssetValue = sumBy(assets, (a) => a.value);
  const netWorth = totalBankBalance + totalAssetValue - totalCreditDebt - totalLoanOutstanding;

  const chartData = useMemo(
    () => getMonthlyChartData(transactions),
    [transactions],
  );

  const recentTransactions = transactions.slice(0, 5);

  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Net Worth */}
      <Card className="mb-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
          <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(Math.abs(netWorth), 'INR')}
          </p>
          {netWorth < 0 && (
            <p className="text-xs text-destructive mt-1">Negative net worth</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon={<Landmark className="h-4 w-4 text-primary" />}
          label="Bank Balance"
          value={formatCurrency(totalBankBalance, 'INR')}
        />
        <StatCard
          icon={<CreditCard className="h-4 w-4 text-destructive" />}
          label="Credit Debt"
          value={formatCurrency(totalCreditDebt, 'INR')}
        />
        <StatCard
          icon={<PiggyBank className="h-4 w-4 text-emerald-600" />}
          label="Assets"
          value={formatCurrency(totalAssetValue, 'INR')}
        />
        <StatCard
          icon={<Receipt className="h-4 w-4 text-amber-600" />}
          label="Loan Outstanding"
          value={formatCurrency(totalLoanOutstanding, 'INR')}
        />
      </div>

      {/* Income vs Expenses Chart */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Income vs Expenses (6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No transactions yet. Use the Chat tab to add one!
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((t) => (
                <TransactionRow key={t.id} transaction={t} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}

// ────────────────────────────────────────────────────────────────
// Sub-Components
// ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function TransactionRow({ transaction: t }: { transaction: Transaction }) {
  const category = getCategoryInfo(t.category);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl">{category.icon}</span>
        <div>
          <p className="text-sm font-medium line-clamp-1">{t.description}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(t.date), 'dd MMM yyyy')}
          </p>
        </div>
      </div>
      <p
        className={`text-sm font-semibold ${
          t.type === 'income' ? 'text-emerald-600' : 'text-destructive'
        }`}
      >
        {t.type === 'income' ? '+' : '-'}
        {formatCurrency(t.amount, t.currency)}
      </p>
    </div>
  );
}
