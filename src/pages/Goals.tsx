import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { MilestoneCelebration, useMilestoneCelebration } from '@/components/MilestoneCelebration';
import { useFinancialGoals, GOAL_CATEGORIES, getGoalCategoryInfo } from '@/hooks/useFinancialGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/currencies';
import { GoalCategory } from '@/types/finance';
import { Plus, Trash2, Target, TrendingUp, MessageSquare, Link2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Goals() {
  const { goals, addGoal, addContribution, linkTransaction, deleteGoal } = useFinancialGoals();
  const { transactions } = useTransactions();
  const { current: celebration, celebrate, dismiss } = useMilestoneCelebration();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [contribGoalId, setContribGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [linkGoalId, setLinkGoalId] = useState<string | null>(null);

  // New goal form
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>('custom');

  const catInfo = getGoalCategoryInfo(selectedCategory);

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
      icon: catInfo.icon,
      category: selectedCategory,
      color: catInfo.color,
    });
    toast.success('Goal created!');
    setName('');
    setTarget('');
    setDeadline('');
    setSelectedCategory('custom');
    setDialogOpen(false);
  };

  const handleContribute = (id: string) => {
    const amount = parseFloat(contribAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const goal = goals.find((g) => g.id === id);
    const { newMilestones } = addContribution(id, amount);
    toast.success(`Added ${formatCurrency(amount, 'INR')}!`);
    if (newMilestones.length > 0 && goal) {
      celebrate(newMilestones, goal.name);
    }
    setContribGoalId(null);
    setContribAmount('');
  };

  const handleLinkTransaction = (goalId: string, txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    const goal = goals.find((g) => g.id === goalId);
    if (!tx || !goal) return;

    const { newMilestones } = linkTransaction(goalId, txId, tx.amount, tx.description);
    toast.success(`Linked "${tx.description}" — ${formatCurrency(tx.amount, tx.currency)} added`);
    if (newMilestones.length > 0) {
      celebrate(newMilestones, goal.name);
    }
    setLinkGoalId(null);
  };

  // Get income transactions not yet linked to this goal
  const getUnlinkedTransactions = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    const linked = goal?.linkedTransactionIds ?? [];
    return transactions
      .filter((t) => t.type === 'income' && !linked.includes(t.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  return (
    <AppLayout>
      {/* Celebration overlay */}
      {celebration && (
        <MilestoneCelebration
          milestone={celebration.milestone}
          goalName={celebration.goalName}
          onDone={dismiss}
        />
      )}

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
              {/* Category picker */}
              <div>
                <Label className="text-xs mb-2 block">Category</Label>
                <div className="grid grid-cols-4 gap-2">
                  {GOAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        if (!name.trim()) setName(cat.label);
                      }}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-center transition-all ${
                        selectedCategory === cat.value
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-[10px] font-medium leading-tight">{cat.label}</span>
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
          <p className="text-xs mt-1 mb-4">Set a savings target and track your progress</p>
          <Link to="/chat">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
              <MessageSquare className="h-3.5 w-3.5" /> Add via Chat
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
            const isComplete = goal.currentAmount >= goal.targetAmount;
            const goalColor = goal.color ?? 'hsl(var(--primary))';
            const celebrated = goal.celebratedMilestones ?? [];

            return (
              <Card key={goal.id} className="group overflow-hidden">
                {/* Color accent bar */}
                <div className="h-1" style={{ backgroundColor: goalColor }} />
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <Link to={`/goals/${goal.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${goalColor}15` }}
                        >
                          {goal.icon}
                        </div>
                        <div>
                        <p className="text-sm font-semibold">{goal.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${goalColor}15`, color: goalColor }}
                          >
                            {getGoalCategoryInfo(goal.category ?? 'custom').label}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(goal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {goal.deadline && (
                            <span className="text-[10px] text-muted-foreground">
                              → {new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      }
                      title={`Delete "${goal.name}"?`}
                      description={`This will remove the goal and all tracked progress (${formatCurrency(goal.currentAmount, goal.currency)} saved).`}
                      onConfirm={() => { deleteGoal(goal.id); toast.success('Goal removed'); }}
                    />
                  </div>

                  {/* Milestone dots */}
                  <div className="flex items-center gap-1 mb-1.5">
                    {[25, 50, 75, 100].map((m) => (
                      <div
                        key={m}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          celebrated.includes(m) ? 'scale-125' : 'opacity-30'
                        }`}
                        style={{ backgroundColor: celebrated.includes(m) ? goalColor : 'hsl(var(--muted-foreground))' }}
                        title={`${m}%`}
                      />
                    ))}
                    <span className="text-[9px] text-muted-foreground ml-1">milestones</span>
                  </div>

                  <Progress
                    value={pct}
                    className="h-2.5 rounded-full mb-2"
                    style={{ ['--progress-color' as string]: goalColor }}
                  />
                  {/* Override progress bar color via inline style */}
                  <style>{`
                    [style*="--progress-color: ${goalColor}"] > div {
                      background-color: ${goalColor} !important;
                    }
                  `}</style>

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrency(goal.currentAmount, goal.currency)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        / {formatCurrency(goal.targetAmount, goal.currency)}
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isComplete ? 'hsl(var(--success))' : goalColor }}
                    >
                      {Math.round(pct)}%
                    </span>
                  </div>

                  {/* Recent contributions (last 3) */}
                  {(goal.contributions ?? []).length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Recent Savings
                      </p>
                      <div className="space-y-1">
                        {[...(goal.contributions ?? [])]
                          .reverse()
                          .slice(0, 3)
                          .map((c) => (
                            <div key={c.id} className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg bg-muted/40">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span>{c.source === 'manual' ? '✋' : '🔗'}</span>
                                <span className="text-muted-foreground truncate">
                                  {c.source === 'transaction' && c.label ? c.label : 'Manual contribution'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-semibold" style={{ color: goalColor }}>
                                  +{formatCurrency(c.amount, goal.currency)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                      <Link
                        to={`/goals/${goal.id}`}
                        className="block text-center text-[11px] font-medium text-primary hover:underline pt-1"
                      >
                        View all ({(goal.contributions ?? []).length}) →
                      </Link>
                    </div>
                  )}

                  {/* Actions */}
                  {!isComplete && (
                    <div className="mt-3 space-y-2">
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
                      ) : linkGoalId === goal.id ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Link income transaction</p>
                          {getUnlinkedTransactions(goal.id).length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">No unlinked income transactions</p>
                          ) : (
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {getUnlinkedTransactions(goal.id).map((tx) => (
                                <button
                                  key={tx.id}
                                  onClick={() => handleLinkTransaction(goal.id, tx.id)}
                                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted text-xs transition-colors"
                                >
                                  <span className="font-medium truncate">{tx.description}</span>
                                  <span className="font-semibold text-success shrink-0 ml-2">
                                    +{formatCurrency(tx.amount, tx.currency)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                          <Button size="sm" variant="ghost" className="rounded-lg w-full text-xs" onClick={() => setLinkGoalId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 text-xs rounded-lg"
                            onClick={() => setContribGoalId(goal.id)}
                          >
                            <TrendingUp className="h-3 w-3" /> Add Manually
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 text-xs rounded-lg"
                            onClick={() => setLinkGoalId(goal.id)}
                          >
                            <Link2 className="h-3 w-3" /> Link Transaction
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {isComplete && (
                    <p className="text-xs font-semibold mt-2 text-center" style={{ color: 'hsl(var(--success))' }}>
                      🎉 Goal reached!
                    </p>
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
