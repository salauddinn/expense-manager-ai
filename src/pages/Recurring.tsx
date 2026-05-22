import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useTransactions } from '@/hooks/useTransactions';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryInfo } from '@/lib/categories';
import { formatCurrency, CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currencies';
import { RecurringFrequency, CategoryType, TransactionType } from '@/types/finance';
import { Plus, Trash2, RefreshCw, Play } from 'lucide-react';
import { toast } from 'sonner';
import { format, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function Recurring() {
  const { recurringTransactions, isLoading, addRecurring, deleteRecurring, toggleActive, advanceNextDate } = useRecurringTransactions();
  const { addTransaction } = useTransactions();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType>('food');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  const handleAdd = async () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error('Enter a description and valid amount');
      return;
    }
    await addRecurring({
      type,
      amount: parseFloat(amount),
      currency,
      category,
      description: description.trim(),
      frequency,
      startDate,
      endDate: endDate || undefined,
    });
    toast.success('Recurring transaction created!');
    setDescription('');
    setAmount('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate('');
    setDialogOpen(false);
  };

  const handleRunNow = async (rt: (typeof recurringTransactions)[0]) => {
    await addTransaction({
      type: rt.type,
      amount: rt.amount,
      currency: rt.currency,
      category: rt.category,
      description: rt.description,
      date: new Date().toISOString(),
      linkedAccountId: rt.linkedAccountId,
      linkedCardId: rt.linkedCardId,
    });
    await advanceNextDate(rt.id, rt.nextDate, rt.frequency);
    toast.success(`Added: ${rt.description}`);
  };

  const categoryOptions = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const dueCount = recurringTransactions.filter((rt) => rt.isActive && isPast(parseISO(rt.nextDate))).length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Recurring</h1>
          {dueCount > 0 && (
            <p className="text-xs text-warning font-medium mt-0.5">
              {dueCount} transaction{dueCount > 1 ? 's' : ''} due
            </p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-full px-4 shadow-md shadow-primary/20">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Recurring Transaction</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => { setType(v as TransactionType); setCategory(v === 'income' ? 'salary' : 'food'); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Netflix, Rent, Salary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date (opt.)</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full rounded-xl h-11">Create Recurring</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && recurringTransactions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 opacity-30" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">No recurring transactions</p>
          <p className="text-xs mt-1 mb-4 text-muted-foreground/70">Set up rules for subscriptions, rent, salary, etc.</p>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add First Rule
          </Button>
        </div>
      ) : !isLoading ? (
        <div className="space-y-3">
          {recurringTransactions.map((rt) => {
            const cat = getCategoryInfo(rt.category as CategoryType);
            const isDue = rt.isActive && isPast(parseISO(rt.nextDate));
            return (
              <Card
                key={rt.id}
                className={cn(
                  'transition-all',
                  isDue && 'border-warning/40 bg-warning/5',
                  !rt.isActive && 'opacity-60',
                )}
              >
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0',
                        rt.type === 'expense' ? 'bg-destructive/10' : 'bg-success/10',
                      )}>
                        {cat.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{rt.description}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className={cn(
                            'text-sm font-bold tabular-nums',
                            rt.type === 'expense' ? 'text-destructive' : 'text-success',
                          )}>
                            {rt.type === 'expense' ? '-' : '+'}{formatCurrency(rt.amount, rt.currency)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {FREQUENCY_LABELS[rt.frequency]}
                          </span>
                          <span className="text-[11px] text-muted-foreground">·</span>
                          <span className={cn(
                            'text-[11px] font-medium',
                            isDue ? 'text-warning' : 'text-muted-foreground',
                          )}>
                            {isDue ? 'Due now' : `Next: ${format(parseISO(rt.nextDate), 'dd MMM yyyy')}`}
                          </span>
                        </div>
                        {rt.endDate && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Ends {format(parseISO(rt.endDate), 'dd MMM yyyy')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDue && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 border-warning/40 text-warning hover:bg-warning/10 rounded-lg"
                          onClick={() => handleRunNow(rt)}
                        >
                          <Play className="h-3 w-3" /> Run
                        </Button>
                      )}
                      <Switch
                        checked={rt.isActive}
                        onCheckedChange={(checked) => toggleActive(rt.id, checked)}
                        className="scale-75"
                      />
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        }
                        title={`Delete "${rt.description}"?`}
                        description="This recurring rule will be removed. Past transactions are not affected."
                        onConfirm={() => { deleteRecurring(rt.id); toast.success('Deleted'); }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </AppLayout>
  );
}
