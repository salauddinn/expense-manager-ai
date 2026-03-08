import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategoryInfo } from '@/lib/categories';
import { formatCurrency } from '@/lib/currencies';
import { CategoryType } from '@/types/finance';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import {
  startOfMonth, endOfMonth, subMonths, isWithinInterval, format,
} from 'date-fns';

const COLORS = [
  'hsl(230, 75%, 58%)', 'hsl(152, 60%, 38%)', 'hsl(0, 72%, 51%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(190, 70%, 45%)',
  'hsl(330, 65%, 50%)', 'hsl(60, 70%, 45%)', 'hsl(200, 70%, 50%)',
  'hsl(100, 50%, 40%)', 'hsl(20, 80%, 50%)',
];

export default function Insights() {
  const { transactions } = useTransactions();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // This month's expenses by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([category, amount]) => {
        const info = getCategoryInfo(category as CategoryType);
        return { name: info.label, value: amount, icon: info.icon, category };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, monthStart, monthEnd]);

  const totalSpent = categoryBreakdown.reduce((s, c) => s + c.value, 0);

  // Month-over-month trend (6 months)
  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const expense = transactions
        .filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
        .reduce((s, t) => s + t.amount, 0);
      const income = transactions
        .filter((t) => t.type === 'income' && isWithinInterval(new Date(t.date), { start, end }))
        .reduce((s, t) => s + t.amount, 0);
      return { name: format(date, 'MMM'), expense, income };
    });
  }, [transactions]);

  // Top 5 biggest expenses this month
  const biggestExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, monthStart, monthEnd]);

  return (
    <AppLayout>
      <h1 className="text-xl font-bold text-foreground tracking-tight mb-6">Spending Insights</h1>

      {transactions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm font-medium">No data yet</p>
          <p className="text-xs mt-1">Add transactions via Chat to see insights</p>
        </div>
      ) : (
        <>
          {/* Category Breakdown Pie Chart */}
          <div className="mb-6">
            <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              This Month by Category
            </h2>
            <Card>
              <CardContent className="pt-4 pb-3">
                {categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No expenses this month</p>
                ) : (
                  <>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {categoryBreakdown.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value, 'INR')}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              fontSize: '12px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mb-4">
                      <p className="text-2xl font-bold">{formatCurrency(totalSpent, 'INR')}</p>
                      <p className="text-[11px] text-muted-foreground">total spent this month</p>
                    </div>
                    {/* Legend */}
                    <div className="space-y-2">
                      {categoryBreakdown.map((cat, i) => (
                        <div key={cat.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="text-xs font-medium">{cat.icon} {cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold tabular-nums">{formatCurrency(cat.value, 'INR')}</span>
                            <span className="text-[10px] text-muted-foreground w-10 text-right">
                              {totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Month-over-Month Trend */}
          <div className="mb-6">
            <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Monthly Trend
            </h2>
            <Card>
              <CardContent className="pt-4 pb-2">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend} barGap={2} barSize={14}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value, 'INR')}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
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

          {/* Top Expenses */}
          <div className="mb-6">
            <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Biggest Expenses This Month
            </h2>
            {biggestExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No expenses this month</p>
            ) : (
              <Card>
                <CardContent className="py-1 px-4">
                  <div className="divide-y divide-border">
                    {biggestExpenses.map((t, i) => {
                      const cat = getCategoryInfo(t.category);
                      return (
                        <div key={t.id} className="flex items-center justify-between py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-sm font-semibold line-clamp-1">{t.description}</p>
                              <p className="text-[11px] text-muted-foreground">{cat.icon} {cat.label}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold tabular-nums text-destructive">
                            −{formatCurrency(t.amount, t.currency)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
