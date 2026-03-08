import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { useAssets } from '@/hooks/useAssets';
import { formatCurrency } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import { TrendingUp, TrendingDown, Landmark, CreditCard, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Dashboard() {
  const { transactions } = useTransactions();
  const { accounts } = useBankAccounts();
  const { cards } = useCreditCards();
  const { loans } = useLoans();
  const { assets } = useAssets();

  const totalBankBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalCreditDebt = cards.reduce((s, c) => s + c.outstanding, 0);
  const totalLoanOutstanding = loans.reduce((s, l) => s + l.principal, 0);
  const totalAssetValue = assets.reduce((s, a) => s + a.value, 0);
  const netWorth = totalBankBalance + totalAssetValue - totalCreditDebt - totalLoanOutstanding;

  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthTxns = transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start, end })
      );
      months.push({
        name: format(d, 'MMM'),
        income: monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions]);

  const recentTxns = transactions.slice(0, 5);

  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Net Worth */}
      <Card className="mb-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
          <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
            {formatCurrency(Math.abs(netWorth), 'INR')}
          </p>
          {netWorth < 0 && <p className="text-xs text-destructive mt-1">Negative net worth</p>}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Bank Balance</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(totalBankBalance, 'INR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Credit Debt</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(totalCreditDebt, 'INR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Assets</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(totalAssetValue, 'INR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Loan Outstanding</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(totalLoanOutstanding, 'INR')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Income vs Expenses (6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="income" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
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
          {recentTxns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No transactions yet. Use the Chat tab to add one!
            </p>
          ) : (
            <div className="space-y-3">
              {recentTxns.map((t) => {
                const cat = getCategoryInfo(t.category);
                return (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon}</span>
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(t.date), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-destructive'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}

function Calculator(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
  );
}
