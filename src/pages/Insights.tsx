import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Section } from '@/components/shared/Section';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategoryInfo } from '@/lib/categories';
import { formatCurrency } from '@/lib/currencies';
import { CHART_TOOLTIP_STYLE } from '@/lib/shared';
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

  // Stable month boundaries — recomputed only when transactions change
  const { categoryBreakdown, totalSpent, monthlyTrend, biggestExpenses } = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Category breakdown
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    const categoryBreakdown = Object.entries(map)
      .map(([category, amount]) => {
        const info = getCategoryInfo(category as CategoryType);
        return { name: info.label, value: amount, icon: info.icon, category };
      })
      .sort((a, b) => b.value - a.value);

    const totalSpent = categoryBreakdown.reduce((s, c) => s + c.value, 0);

    // Monthly trend
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
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

    // Top expenses
    const biggestExpenses = transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { categoryBreakdown, totalSpent, monthlyTrend, biggestExpenses };
  }, [transactions]);

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
          <Section title="This Month by Category">
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
                            contentStyle={CHART_TOOLTIP_STYLE}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mb-4">
                      <p className="text-2xl font-bold">{formatCurrency(totalSpent, transactions[0]?.currency ?? 'INR')}</p>
                      <p className="text-[11px] text-muted-foreground">total spent this month</p>
                    </div>
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
          </Section>

          {/* Month-over-Month Trend */}
          <Section title="Monthly Trend">
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

          {/* Top Expenses */}
          <Section title="Biggest Expenses This Month">
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
          </Section>
        </>
      )}
    </AppLayout>
  );
}
