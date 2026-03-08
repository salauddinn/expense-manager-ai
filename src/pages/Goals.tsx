import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import { formatCurrency } from '@/lib/currencies';
import { Plus, Trash2, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const GOAL_ICONS = ['🏖️', '🚨', '🏠', '🚗', '📚', '💍', '🎮', '✈️', '💻', '🎯'];

export default function Goals() {
  const { goals, addGoal, addContribution, deleteGoal } = useFinancialGoals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contribGoalId, setContribGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');

  // New goal form
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');

  const handleAdd = () => {
    if (!name.trim() || !target || parseFloat(target) <= 0) {
      toast.error('Enter a name and target amount');
      return;
    }
    addGoal({
      name: name.trim(),
      targetAmount: parseFloat(target),
      currency: 'INR',
      deadline: deadline || undefined,
      icon: selectedIcon,
    });
    toast.success('Goal created!');
    setName('');
    setTarget('');
    setDeadline('');
    setSelectedIcon('🎯');
    setDialogOpen(false);
  };

  const handleContribute = (id: string) => {
    const amount = parseFloat(contribAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    addContribution(id, amount);
    toast.success(`Added ${formatCurrency(amount, 'INR')}!`);
    setContribGoalId(null);
    setContribAmount('');
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Financial Goals</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-full px-4 shadow-md shadow-primary/20">
              <Plus className="h-3.5 w-3.5" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs mb-2 block">Pick an icon</Label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`h-10 w-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                        selectedIcon === icon
                          ? 'bg-primary/10 ring-2 ring-primary'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Goal Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vacation Fund" />
              </div>
              <div className="space-y-1.5">
                <Label>Target Amount (₹)</Label>
                <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50000" />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline (optional)</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <Button onClick={handleAdd} className="w-full rounded-xl h-11">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 opacity-40" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">No goals yet</p>
          <p className="text-xs mt-1">Set a savings target and track your progress</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
            const isComplete = goal.currentAmount >= goal.targetAmount;

            return (
              <Card key={goal.id} className="group">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xl">
                        {goal.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{goal.name}</p>
                        {goal.deadline && (
                          <p className="text-[10px] text-muted-foreground">
                            by {new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => { deleteGoal(goal.id); toast.success('Goal removed'); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>

                  <Progress
                    value={pct}
                    className={`h-2 rounded-full mb-2 ${isComplete ? '[&>div]:bg-success' : '[&>div]:bg-primary'}`}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrency(goal.currentAmount, goal.currency)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        / {formatCurrency(goal.targetAmount, goal.currency)}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${isComplete ? 'text-success' : 'text-muted-foreground'}`}>
                      {Math.round(pct)}%
                    </span>
                  </div>

                  {/* Contribution */}
                  {!isComplete && (
                    <div className="mt-3">
                      {contribGoalId === goal.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={contribAmount}
                            onChange={(e) => setContribAmount(e.target.value)}
                            className="h-9 rounded-lg text-sm"
                            autoFocus
                          />
                          <Button size="sm" className="rounded-lg" onClick={() => handleContribute(goal.id)}>
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setContribGoalId(null)}>
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-xs rounded-lg"
                          onClick={() => setContribGoalId(goal.id)}
                        >
                          <TrendingUp className="h-3 w-3" /> Add Contribution
                        </Button>
                      )}
                    </div>
                  )}

                  {isComplete && (
                    <p className="text-xs text-success font-semibold mt-2 text-center">🎉 Goal reached!</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
