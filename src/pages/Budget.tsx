import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useBudgetGoals } from '@/hooks/useBudgetGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { EXPENSE_CATEGORIES, getCategoryInfo } from '@/lib/categories';
import { formatCurrency } from '@/lib/currencies';
import { CategoryType } from '@/types/finance';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Plus, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function Budget() {
  const { goals, addGoal, deleteGoal } = useBudgetGoals();
  const { transactions } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [limit, setLimit] = useState('');
  const [showForm, setShowForm] = useState(false);

  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return map;
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

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Budget Goals</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
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
              placeholder="Monthly limit (₹)"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
            <Button onClick={handleAdd} className="w-full">Save Goal</Button>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No budget goals yet. Add one to track your spending!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const cat = getCategoryInfo(goal.category);
            const spent = monthlyExpenses[goal.category] || 0;
            const percentage = Math.min((spent / goal.monthlyLimit) * 100, 100);
            const isOver = spent > goal.monthlyLimit;

            return (
              <Card key={goal.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteGoal(goal.id); toast.success('Goal removed'); }}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  <Progress value={percentage} className={`h-2 mb-2 ${isOver ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}`} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className={isOver ? 'text-destructive font-medium' : ''}>
                      {formatCurrency(spent, goal.currency)} spent
                    </span>
                    <span>of {formatCurrency(goal.monthlyLimit, goal.currency)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
