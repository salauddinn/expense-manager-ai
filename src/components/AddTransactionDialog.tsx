/**
 * Dialog for manually adding a new transaction.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CURRENCIES } from '@/lib/currencies';
import { ALL_CATEGORIES as CATEGORIES } from '@/lib/categories';
import { CategoryType, TransactionType } from '@/types/finance';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddTransactionDialogProps {
  onAdd: (t: {
    type: TransactionType;
    amount: number;
    currency: string;
    category: CategoryType;
    description: string;
    date: string;
    cashback?: number;
  }) => void;
}

export function AddTransactionDialog({ onAdd }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType>('other');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState('INR');
  const [cashback, setCashback] = useState(0);

  const handleAdd = () => {
    if (!description.trim() || amount <= 0) {
      toast.error('Please enter a description and amount');
      return;
    }
    onAdd({
      type,
      amount,
      currency,
      category,
      description,
      date: new Date(date).toISOString(),
      ...(cashback > 0 && { cashback }),
    });
    // Reset form
    setType('expense');
    setAmount(0);
    setDescription('');
    setCategory('other');
    setDate(new Date().toISOString().slice(0, 10));
    setCashback(0);
    setOpen(false);
    toast.success('Transaction added');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-full">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Type">
            <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Lunch at cafe" />
          </Field>
          <Field label="Amount">
            <Input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0" />
          </Field>
          <Field label="Category">
            <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Currency">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cashback (optional)">
            <Input type="number" value={cashback || ''} onChange={(e) => setCashback(Number(e.target.value))} placeholder="0" />
          </Field>
          <Button onClick={handleAdd} className="w-full rounded-xl h-11">Add Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
