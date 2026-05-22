import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Section } from '@/components/shared/Section';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgetGoals } from '@/hooks/useBudgetGoals';
import { getCategoryInfo } from '@/lib/categories';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currencies';
import { CHART_TOOLTIP_STYLE } from '@/lib/shared';
import { CategoryType } from '@/types/finance';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, LineChart, Line,
} from 'recharts';
import {
  startOfMonth, endOfMonth, subMonths, isWithinInterval, format, getDaysInMonth, getDate,
} from 'date-fns';
import { MessageSquare, TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Minus } from 'lucide-react';

const COLORS = [
  'hsl(230, 75%, 58%)', 'hsl(152, 60%, 38%)', 'hsl(0, 72%, 51%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(190, 70%, 45%)',
  'hsl(330, 65%, 50%)', 'hsl(60, 70%, 45%)', 'hsl(200, 70%, 50%)',
  'hsl(100, 50%, 40%)', 'hsl(20, 80%, 50%)',
];

type InsightTab = 'overview' | 'trends' | 'predictions';

export default function Insights() {
  const { transactions, isLoading } = useTransactions();
  const { goals: budgetGoals } = useBudgetGoals();
  const [tab, setTab] = useState<InsightTab>('overview');

  const primaryCurrency = transactions[0]?.currency ?? DEFAULT_CURRENCY;

  const analytics = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthExpenses = transactions.filter(
      (t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
    );
    const lastMonthExpenses = transactions.filter(
      (t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd })
    );
    const thisMonthIncome = transactions.filter(
      (t) => t.type === 'income' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
    );

    const categoryMap: Record<string, number> = {};
    thisMonthExpenses.forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, amount]) => {
        const info = getCategoryInfo(category as CategoryType);
        return { name: info.label, value: amount, icon: info.icon, category };
      })
      .sort((a, b) => b.value - a.value);

    const totalSpent = categoryBreakdown.reduce((s, c) => s + c.value, 0);
    const totalIncome = thisMonthIncome.reduce((s, t) => s + t.amount, 0);
    const totalLastMonth = lastMonthExpenses.reduce((s, t) => s + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
    const spendingChange = totalLastMonth > 0
      ? ((totalSpent - totalLastMonth) / totalLastMonth) * 100
      : 0;

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
      return { name: format(date, 'MMM'), expense, income, savings: Math.max(0, income - expense) };
    });

    const biggestExpenses = [...thisMonthExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Category trends (this vs last month)
    const lastMonthCatMap: Record<string, number> = {};
    lastMonthExpenses.forEach((t) => {
      lastMonthCatMap[t.category] = (lastMonthCatMap[t.category] || 0) + t.amount;
    });
    const categoryTrends = categoryBreakdown.map((cat) => ({
      ...cat,
      lastMonth: lastMonthCatMap[cat.category] || 0,
      change: lastMonthCatMap[cat.category]
        ? ((cat.value - lastMonthCatMap[cat.category]) / lastMonthCatMap[cat.category]) * 100
        : null,
    }));

    // Predictive insights
    const today = getDate(now);
    const daysInMonth = getDaysInMonth(now);
    const projectedSpend = today > 0 ? (totalSpent / today) * daysInMonth : 0;

    const predictions = budgetGoals
      .map((goal) => {
        const spent = categoryMap[goal.category] || 0;
        const projected = today > 0 ? (spent / today) * daysInMonth : 0;
        const cat = getCategoryInfo(goal.category as CategoryType);
        const pct = (spent / goal.monthlyLimit) * 100;
        const projectedPct = (projected / goal.monthlyLimit) * 100;
        return {
          category: cat.label,
          icon: cat.icon,
          spent,
          limit: goal.monthlyLimit,
          projected,
          pct,
          projectedPct,
          currency: goal.currency,
          isOverBudget: spent > goal.monthlyLimit,
          willExceed: projected > goal.monthlyLimit && spent <= goal.monthlyLimit,
          isOnTrack: projected <= goal.monthlyLimit,
        };
      })
      .sort((a, b) => b.projectedPct - a.projectedPct);

    // Weekly spending pattern (last 4 weeks)
    const weeklyPattern = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (3 - i) * 7 - 6);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (3 - i) * 7);
      const spent = transactions
        .filter((t) => t.type === 'expense' && new Date(t.date) >= weekStart && new Date(t.date) <= weekEnd)
        .reduce((s, t) => s + t.amount, 0);
      return { name: `Week ${i + 1}`, spent };
    });

    return {
      categoryBreakdown,
      totalSpent,
      totalIncome,
      savingsRate,
      spendingChange,
      monthlyTrend,
      biggestExpenses,
      categoryTrends,
      predictions,
      projectedSpend,
      weeklyPattern,
    };
  }, [transactions, budgetGoals]);

  const TABS: { key: InsightTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'trends', label: 'Trends' },
    { key: 'predictions', label: 'Predictions' },
  ];

  return (
    <AppLayout>
      <h1 className="text-xl font-bold text-foreground tracking-tight mb-4">Spending Insights</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              tab === t.key
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}

      {!isLoading && transactions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 opacity-30" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">No data yet</p>
          <p className="text-xs mt-1 mb-4">Add transactions via Chat to see insights</p>
          <Link to="/chat">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
              <MessageSquare className="h-3.5 w-3.5" /> Go to Chat
            </Button>
          </Link>
        </div>
      ) : !isLoading && (
        <>
          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <>
              {/* Month summary stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Spent This Month</p>
                    <p className="text-xl font-bold text-destructive tabular-nums">{formatCurrency(analytics.totalSpent, primaryCurrency)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {analytics.spendingChange > 0 ? (
                        <TrendingUp className="h-3 w-3 text-destructive" />
                      ) : analytics.spendingChange < 0 ? (
                        <TrendingDown className="h-3 w-3 text-success" />
                      ) : (
                        <Minus className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={`text-[10px] font-medium ${
                        analytics.spendingChange > 0 ? 'text-destructive' : analytics.spendingChange < 0 ? 'text-success' : 'text-muted-foreground'
                      }`}>
                        {analytics.spendingChange === 0
                          ? 'No change'
                          : `${Math.abs(analytics.spendingChange).toFixed(0)}% vs last month`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Savings Rate</p>
                    <p className={`text-xl font-bold tabular-nums ${analytics.savingsRate >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {analytics.savingsRate.toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {analytics.savingsRate >= 20
                        ? 'Great savings!'
                        : analytics.savingsRate >= 0
                        ? 'Room to improve'
                        : 'Spending over income'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown Pie Chart */}
              <Section title="This Month by Category">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    {analytics.categoryBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No expenses this month</p>
                    ) : (
                      <>
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.categoryBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                                strokeWidth={0}
                              >
                                {analytics.categoryBreakdown.map((_, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => formatCurrency(value, primaryCurrency)}
                                contentStyle={CHART_TOOLTIP_STYLE}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-center mb-4">
                          <p className="text-2xl font-bold">{formatCurrency(analytics.totalSpent, primaryCurrency)}</p>
                          <p className="text-[11px] text-muted-foreground">total spent this month</p>
                        </div>
                        <div className="space-y-2">
                          {analytics.categoryBreakdown.map((cat, i) => (
                            <div key={cat.category} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span className="text-xs font-medium">{cat.icon} {cat.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold tabular-nums">{formatCurrency(cat.value, primaryCurrency)}</span>
                                <span className="text-[10px] text-muted-foreground w-10 text-right">
                                  {analytics.totalSpent > 0 ? Math.round((cat.value / analytics.totalSpent) * 100) : 0}%
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

              {/* Top Expenses */}
              <Section title="Biggest Expenses This Month">
                {analytics.biggestExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No expenses this month</p>
                ) : (
                  <Card>
                    <CardContent className="py-1 px-4">
                      <div className="divide-y divide-border">
                        {analytics.biggestExpenses.map((t, i) => {
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
                                -{formatCurrency(t.amount, t.currency)}
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

          {/* ── TRENDS TAB ── */}
          {tab === 'trends' && (
            <>
              {/* Monthly income vs expense trend */}
              <Section title="6-Month Income vs Expenses">
                <Card>
                  <CardContent className="pt-4 pb-2">
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.monthlyTrend} barGap={2} barSize={14}>
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          />
                          <YAxis hide />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value, primaryCurrency)}
                            contentStyle={CHART_TOOLTIP_STYLE}
                          />
                          <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[6, 6, 6, 6]} />
                          <Bar dataKey="expense" name="Expenses" fill="hsl(var(--destructive))" radius={[6, 6, 6, 6]} opacity={0.7} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Section>

              {/* Savings trend */}
              <Section title="Monthly Savings">
                <Card>
                  <CardContent className="pt-4 pb-2">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.monthlyTrend}>
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          />
                          <YAxis hide />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value, primaryCurrency)}
                            contentStyle={CHART_TOOLTIP_STYLE}
                          />
                          <Line
                            type="monotone"
                            dataKey="savings"
                            name="Savings"
                            stroke="hsl(var(--success))"
                            strokeWidth={2.5}
                            dot={{ fill: 'hsl(var(--success))', strokeWidth: 0, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Section>

              {/* Category trends (this vs last month) */}
              <Section title="Category: This vs Last Month">
                {analytics.categoryTrends.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No expense data</p>
                ) : (
                  <Card>
                    <CardContent className="py-1 px-4">
                      <div className="divide-y divide-border">
                        {analytics.categoryTrends.map((cat, i) => (
                          <div key={cat.category} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              />
                              <span className="text-xs font-medium truncate">{cat.icon} {cat.name}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="text-xs font-semibold tabular-nums">{formatCurrency(cat.value, primaryCurrency)}</p>
                                {cat.lastMonth > 0 && (
                                  <p className="text-[10px] text-muted-foreground">was {formatCurrency(cat.lastMonth, primaryCurrency)}</p>
                                )}
                              </div>
                              {cat.change !== null && (
                                <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                                  cat.change > 0 ? 'text-destructive' : 'text-success'
                                }`}>
                                  {cat.change > 0
                                    ? <TrendingUp className="h-3 w-3" />
                                    : <TrendingDown className="h-3 w-3" />}
                                  {Math.abs(cat.change).toFixed(0)}%
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </Section>
            </>
          )}

          {/* ── PREDICTIONS TAB ── */}
          {tab === 'predictions' && (
            <>
              {/* Monthly projection */}
              <Card className="mb-5">
                <CardContent className="pt-4 pb-4 px-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Projected Monthly Spend
                  </p>
                  <p className="text-3xl font-extrabold tabular-nums text-foreground">
                    {formatCurrency(analytics.projectedSpend, primaryCurrency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {formatCurrency(analytics.totalSpent, primaryCurrency)} spent so far this month
                  </p>
                </CardContent>
              </Card>

              {analytics.predictions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-7 w-7 opacity-30" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">No budget goals set</p>
                  <p className="text-xs text-muted-foreground/70 mb-4">Set budget goals to see predictions</p>
                  <Link to="/budget">
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
                      Set Budget Goals
                    </Button>
                  </Link>
                </div>
              ) : (
                <Section title="Budget Predictions">
                  <div className="space-y-3">
                    {analytics.predictions.map((pred) => (
                      <Card key={pred.category} className={pred.isOverBudget ? 'border-destructive/30' : pred.willExceed ? 'border-warning/30' : ''}>
                        <CardContent className="pt-4 pb-3 px-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{pred.icon}</span>
                              <div>
                                <p className="text-sm font-semibold">{pred.category}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {formatCurrency(pred.spent, pred.currency)} of {formatCurrency(pred.limit, pred.currency)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {pred.isOverBudget ? (
                                <>
                                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                  <span className="text-[11px] font-semibold text-destructive">Over budget</span>
                                </>
                              ) : pred.willExceed ? (
                                <>
                                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                  <span className="text-[11px] font-semibold text-warning">Will exceed</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                                  <span className="text-[11px] font-semibold text-success">On track</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pred.isOverBudget ? 'bg-destructive' : pred.willExceed ? 'bg-warning' : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(pred.pct, 100)}%` }}
                            />
                          </div>
                          {(pred.willExceed || pred.isOverBudget) && (
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              {pred.isOverBudget
                                ? `Over by ${formatCurrency(pred.spent - pred.limit, pred.currency)}`
                                : `Projected to exceed by ${formatCurrency(pred.projected - pred.limit, pred.currency)}`}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </>
      )}
    </AppLayout>
  );
}
