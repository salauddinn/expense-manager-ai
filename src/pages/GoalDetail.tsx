import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { MilestoneCelebration, useMilestoneCelebration } from '@/components/MilestoneCelebration';
import { useFinancialGoals, getGoalCategoryInfo } from '@/hooks/useFinancialGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/currencies';
import { ArrowLeft, TrendingUp, Link2, Trash2, Clock, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, addContribution, linkTransaction, deleteGoal } = useFinancialGoals();
  const { transactions } = useTransactions();
  const { current: celebration, celebrate, dismiss } = useMilestoneCelebration();

  const goal = goals.find((g) => g.id === id);

  const [contribAmount, setContribAmount] = useState('');
  const [showContrib, setShowContrib] = useState(false);
  const [showLink, setShowLink] = useState(false);

  if (!goal) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm font-medium">Goal not found</p>
          <Link to="/goals">
            <Button variant="outline" size="sm" className="mt-4 rounded-full">
              ← Back to Goals
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const goalColor = goal.color ?? 'hsl(var(--primary))';
  const celebrated = goal.celebratedMilestones ?? [];
  const contributions = [...(goal.contributions ?? [])].reverse();
  const catInfo = getGoalCategoryInfo(goal.category ?? 'custom');

  const linkedIds = goal.linkedTransactionIds ?? [];
  const linkedTxs = transactions.filter((t) => linkedIds.includes(t.id));
  const unlinkedTxs = transactions
    .filter((t) => t.type === 'income' && !linkedIds.includes(t.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  const handleContribute = async () => {
    const amount = parseFloat(contribAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    const { newMilestones } = await addContribution(goal.id, amount);
    toast.success(`Added ${formatCurrency(amount, goal.currency)}!`);
    if (newMilestones.length > 0) celebrate(newMilestones, goal.name);
    setContribAmount('');
    setShowContrib(false);
  };

  const handleLink = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;
    const { newMilestones } = await linkTransaction(goal.id, txId, tx.amount, tx.description);
    toast.success(`Linked "${tx.description}"`);
    if (newMilestones.length > 0) celebrate(newMilestones, goal.name);
    setShowLink(false);
  };

  const handleDelete = () => {
    deleteGoal(goal.id);
    toast.success('Goal removed');
    navigate('/goals');
  };

  return (
    <AppLayout>
      {celebration && (
        <MilestoneCelebration milestone={celebration.milestone} goalName={celebration.goalName} onDone={dismiss} />
      )}

      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground" onClick={() => navigate('/goals')}>
        <ArrowLeft className="h-4 w-4" /> Goals
      </Button>

      {/* Header card */}
      <Card className="overflow-hidden mb-4">
        <div className="h-1.5" style={{ backgroundColor: goalColor }} />
        <CardContent className="pt-5 pb-4 px-4">
          <div className="flex items-start gap-3 mb-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: `${goalColor}15` }}
            >
              {goal.icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">{goal.name}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${goalColor}15`, color: goalColor }}
                >
                  {catInfo.label}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  Created {new Date(goal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {goal.deadline && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <CalendarDays className="h-2.5 w-2.5" />
                    Due {new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Milestone dots */}
          <div className="flex items-center gap-2 mb-2">
            {[25, 50, 75, 100].map((m) => (
              <div key={m} className="flex items-center gap-1">
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all ${celebrated.includes(m) ? 'scale-110' : 'opacity-25'}`}
                  style={{ backgroundColor: celebrated.includes(m) ? goalColor : 'hsl(var(--muted-foreground))' }}
                />
                <span className="text-[9px] text-muted-foreground">{m}%</span>
              </div>
            ))}
          </div>

          <Progress value={pct} className="h-3 rounded-full mb-2" style={{ ['--progress-color' as string]: goalColor }} />
          <style>{`[style*="--progress-color: ${goalColor}"] > div { background-color: ${goalColor} !important; }`}</style>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold tabular-nums">{formatCurrency(goal.currentAmount, goal.currency)}</span>
              <span className="text-xs text-muted-foreground">/ {formatCurrency(goal.targetAmount, goal.currency)}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: isComplete ? 'hsl(var(--success))' : goalColor }}>
              {Math.round(pct)}%
            </span>
          </div>

          {isComplete && (
            <p className="text-sm font-semibold mt-3 text-center" style={{ color: 'hsl(var(--success))' }}>🎉 Goal reached!</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {!isComplete && (
        <div className="flex gap-2 mb-4">
          {showContrib ? (
            <div className="flex gap-2 flex-1">
              <Input
                type="number"
                placeholder="Amount"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                className="h-9 rounded-lg text-sm"
                autoFocus
              />
              <Button size="sm" className="rounded-lg" onClick={handleContribute}>Add</Button>
              <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setShowContrib(false)}>✕</Button>
            </div>
          ) : (
            <>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs rounded-lg" onClick={() => { setShowContrib(true); setShowLink(false); }}>
                <TrendingUp className="h-3 w-3" /> Add Manually
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs rounded-lg" onClick={() => { setShowLink(!showLink); setShowContrib(false); }}>
                <Link2 className="h-3 w-3" /> Link Transaction
              </Button>
            </>
          )}
        </div>
      )}

      {/* Link transaction picker */}
      {showLink && (
        <Card className="mb-4">
          <CardContent className="pt-3 pb-3 px-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Link income transaction</p>
            {unlinkedTxs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No unlinked income transactions</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {unlinkedTxs.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => handleLink(tx.id)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted text-xs transition-colors"
                  >
                    <span className="font-medium truncate">{tx.description}</span>
                    <span className="font-semibold shrink-0 ml-2" style={{ color: 'hsl(var(--success))' }}>
                      +{formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Full contribution history */}
      <Card className="mb-4">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Savings History ({contributions.length})
          </p>
          {contributions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No contributions yet</p>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-1 pr-2">
                {contributions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[11px] px-2.5 py-2 rounded-lg bg-muted/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{c.source === 'manual' ? '✋' : '🔗'}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {c.source === 'transaction' && c.label ? c.label : 'Manual contribution'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}
                          {new Date(c.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold shrink-0 ml-2" style={{ color: goalColor }}>
                      +{formatCurrency(c.amount, goal.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Linked transactions */}
      {linkedTxs.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Linked Transactions ({linkedTxs.length})
            </p>
            <ScrollArea className="max-h-60">
              <div className="space-y-1 pr-2">
                {linkedTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-[11px] px-2.5 py-2 rounded-lg bg-muted/40">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="font-semibold shrink-0 ml-2" style={{ color: 'hsl(var(--success))' }}>
                      +{formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Delete */}
      <div className="flex justify-center pb-6">
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Delete Goal
            </Button>
          }
          title={`Delete "${goal.name}"?`}
          description={`This will remove the goal and all tracked progress (${formatCurrency(goal.currentAmount, goal.currency)} saved).`}
          onConfirm={handleDelete}
        />
      </div>
    </AppLayout>
  );
}
