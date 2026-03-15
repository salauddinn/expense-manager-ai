import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useBudgetGoals } from '@/hooks/useBudgetGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { EXPENSE_CATEGORIES, getCategoryInfo } from '@/lib/categories';
import { formatCurrency } from '@/lib/currencies';
import { CategoryType } from '@/types/finance';
import {
  startOfMonth, endOfMonth, subMonths, isWithinInterval, getDaysInMonth, getDate,
} from 'date-fns';
import { Plus, Trash2, Target, MessageSquare, TrendingUp, TrendingDown, Minus, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Budget() {
  const { goals, addGoal, deleteGoal, isLoading: goalsLoading } = useBudgetGoals();
  const { transactions, isLoading: txLoading } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [limit, setLimit] = useState('');
  const [showForm, setShowForm] = useState(false);

  const isLoading = goalsLoading || txLoading;

  const budgetData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthMap: Record<string, number> = {};
    const lastMonthMap: Record<string, number> = {};

    transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
      .forEach((t) => { thisMonthMap[t.category] = (thisMonthMap[t.category] || 0) + t.amount; });

    transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd }))
      .forEach((t) => { lastMonthMap[t.category] = (lastMonthMap[t.category] || 0) + t.amount; });

    const today = getDate(now);
    const daysInMonth = getDaysInMonth(now);

    return { thisMonthMap, lastMonthMap, today, daysInMonth };
  }, [transactions]);

  const handleAdd = () => {
    if (!selectedCategory || !limit || parseFloat(limit) <= 0) {
      toast.error('Select a category and enter a valid limit');
      return;
    }
    addGoal(selectedCategory as CategoryType, parseFloat(limit));
    toast.success('Budget goal saved!');
    setSelectedCategory('');
    setLimit('');
    setShowForm(false);
  };

  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !goals.find((g) => g.category === c.value)
  );

  const totalBudget = goals.reduce((s, g) => s + g.monthlyLimit, 0);
  const totalSpent = goals.reduce((s, g) => s + (budgetData.thisMonthMap[g.category] || 0), 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Budget Goals</h1>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1.5 rounded-full px-4 shadow-md shadow-primary/20"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {showForm && (
        <Card className="mb-5">
          <CardContent className="pt-5 pb-4 space-y-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Monthly limit"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="rounded-xl h-11"
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1 rounded-xl h-11">Save Goal</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl h-11 px-4">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && goals.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 opacity-40" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">No budget goals yet</p>
          <p className="text-xs mt-1 mb-4 text-muted-foreground/70">Track your spending by category</p>
          <Link to="/chat">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
              <MessageSquare className="h-3.5 w-3.5" /> Set via Chat
            </Button>
          </Link>
        </div>
      ) : !isLoading && (
        <>
          {goals.length > 1 && (
            <Card className="mb-5">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Budget</p>
                  <span className={`text-xs font-bold tabular-nums ${totalSpent > totalBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {formatCurrency(totalSpent, goals[0]?.currency)} / {formatCurrency(totalBudget, goals[0]?.currency)}
                  </span>
                </div>
                <Progress
                  value={Math.min(totalPct, 100)}
                  className={`h-2 rounded-full ${totalSpent > totalBudget ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}`}
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {totalSpent > totalBudget
                    ? `Over budget by ${formatCurrency(totalSpent - totalBudget, goals[0]?.currency)}`
                    : `${formatCurrency(totalBudget - totalSpent, goals[0]?.currency)} remaining across all categories`}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {goals.map((goal) => {
              const cat = getCategoryInfo(goal.category);
              const spent = budgetData.thisMonthMap[goal.category] || 0;
              const lastMonthSpent = budgetData.lastMonthMap[goal.category] || 0;
              const percentage = Math.min((spent / goal.monthlyLimit) * 100, 100);
              const isOver = spent > goal.monthlyLimit;

              const projected = budgetData.today > 0
                ? (spent / budgetData.today) * budgetData.daysInMonth
                : 0;
              const willExceed = projected > goal.monthlyLimit && !isOver;

              const change = lastMonthSpent > 0
                ? Math.round(((spent - lastMonthSpent) / lastMonthSpent) * 100)
                : null;

              const remaining = goal.monthlyLimit - spent;

              return (
                <Card
                  key={goal.id}
                  className={`group transition-all ${isOver ? 'border-destructive/30' : willExceed ? 'border-warning/30' : ''}`}
                >
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm shrink-0">
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold">{cat.label}</span>
                          {change !== null && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {change > 0
                                ? <TrendingUp className="h-2.5 w-2.5 text-destructive" />
                                : change < 0
                                ? <TrendingDown className="h-2.5 w-2.5 text-success" />
                                : <Minus className="h-2.5 w-2.5 text-muted-foreground" />}
                              <span className={`text-[10px] font-medium ${change > 0 ? 'text-destructive' : change < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                                {change === 0 ? 'Same as last month' : `${Math.abs(change)}% vs last month`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isOver ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-[11px] font-semibold text-destructive">Over</span>
                          </div>
                        ) : willExceed ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                            <span className="text-[11px] font-semibold text-warning">At risk</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-success" />
                            <span className="text-[11px] font-semibold text-success">On track</span>
                          </div>
                        )}
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          }
                          title={`Remove ${cat.label} budget?`}
                          description="This will stop tracking spending against this budget limit."
                          confirmLabel="Remove"
                          onConfirm={() => { deleteGoal(goal.id); toast.success('Goal removed'); }}
                        />
                      </div>
                    </div>

                    <Progress
                      value={percentage}
                      className={`h-2 rounded-full mb-2 ${isOver ? '[&>div]:bg-destructive' : willExceed ? '[&>div]:bg-warning' : '[&>div]:bg-primary'}`}
                    />

                    <div className="flex justify-between text-[11px]">
                      <span className={`font-medium ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formatCurrency(spent, goal.currency)} spent
                      </span>
                      <span className="text-muted-foreground">
                        {isOver
                          ? `${formatCurrency(spent - goal.monthlyLimit, goal.currency)} over`
                          : `${formatCurrency(remaining, goal.currency)} left`} · {formatCurrency(goal.monthlyLimit, goal.currency)} limit
                      </span>
                    </div>

                    {willExceed && (
                      <p className="text-[10px] text-warning mt-1.5 font-medium">
                        Projected to reach {formatCurrency(projected, goal.currency)} at current pace
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </AppLayout>
  );
}
