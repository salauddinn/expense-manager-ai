/**
 * Reusable form dialogs for adding bank accounts, credit cards, and assets.
 * Extracted from Accounts.tsx to reduce file size and improve reusability.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CURRENCIES } from '@/lib/currencies';
import { BankAccount, CreditCard as CreditCardType, Asset } from '@/types/finance';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

// ── Bank Account Dialog ──

export function AddBankDialog({ onAdd }: { onAdd: (a: Omit<BankAccount, 'id'>) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'savings' | 'current' | 'salary'>('savings');
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('INR');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name, type, balance, currency });
    setName('');
    setBalance(0);
    setOpen(false);
    toast.success('Account added');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1.5 text-muted-foreground">
          <Plus className="h-3 w-3" /> Add Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Savings" />
          </Field>
          <Field label="Type">
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Balance">
            <Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
          </Field>
          <CurrencyField value={currency} onChange={setCurrency} />
          <Button onClick={handleAdd} className="w-full rounded-xl h-11">Add Account</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Credit Card Dialog ──

export function AddCardDialog({ onAdd }: { onAdd: (c: Omit<CreditCardType, 'id'>) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('INR');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name, limit, outstanding, dueDate, currency });
    setName('');
    setLimit(0);
    setOutstanding(0);
    setDueDate('');
    setOpen(false);
    toast.success('Card added');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1.5 text-muted-foreground">
          <Plus className="h-3 w-3" /> Add Card
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Credit Card</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ICICI Amazon Pay" />
          </Field>
          <Field label="Credit Limit">
            <Input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
          </Field>
          <Field label="Outstanding">
            <Input type="number" value={outstanding} onChange={(e) => setOutstanding(Number(e.target.value))} />
          </Field>
          <Field label="Due Date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <CurrencyField value={currency} onChange={setCurrency} />
          <Button onClick={handleAdd} className="w-full rounded-xl h-11">Add Card</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Asset Dialog ──

export function AddAssetDialog({ onAdd }: { onAdd: (a: Omit<Asset, 'id'>) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'property' | 'investment' | 'vehicle' | 'other'>('property');
  const [value, setValue] = useState(0);
  const [currency, setCurrency] = useState('INR');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name, type, value, currency });
    setName('');
    setValue(0);
    setOpen(false);
    toast.success('Asset added');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1.5 text-muted-foreground">
          <Plus className="h-3 w-3" /> Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apartment in Mumbai" />
          </Field>
          <Field label="Type">
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Value">
            <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
          </Field>
          <CurrencyField value={currency} onChange={setCurrency} />
          <Button onClick={handleAdd} className="w-full rounded-xl h-11">Add Asset</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Shared Field Helpers ──

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function CurrencyField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Currency">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
