import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAssets } from '@/hooks/useAssets';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { BankAccount, CreditCard as CreditCardType, Asset } from '@/types/finance';
import { Landmark, CreditCard as CreditCardIcon, Gem, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Accounts() {
  const { accounts, addAccount, deleteAccount } = useBankAccounts();
  const { cards, addCard, deleteCard } = useCreditCards();
  const { assets, addAsset, deleteAsset } = useAssets();

  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold text-foreground">Accounts & Assets</h1>

      {/* Bank Accounts */}
      <Section title="Bank Accounts" icon={<Landmark className="h-4 w-4" />}>
        <AddBankDialog onAdd={addAccount} />
        {accounts.length === 0 && <EmptyState text="No bank accounts added" />}
        {accounts.map((a) => (
          <Card key={a.id}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{a.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{formatCurrency(a.balance, a.currency)}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { deleteAccount(a.id); toast.success('Deleted'); }}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </Section>

      {/* Credit Cards */}
      <Section title="Credit Cards" icon={<CreditCardIcon className="h-4 w-4" />}>
        <AddCardDialog onAdd={addCard} />
        {cards.length === 0 && <EmptyState text="No credit cards added" />}
        {cards.map((c) => (
          <Card key={c.id}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">Limit: {formatCurrency(c.limit, c.currency)}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-destructive">{formatCurrency(c.outstanding, c.currency)}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { deleteCard(c.id); toast.success('Deleted'); }}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </Section>

      {/* Assets */}
      <Section title="Assets" icon={<Gem className="h-4 w-4" />}>
        <AddAssetDialog onAdd={addAsset} />
        {assets.length === 0 && <EmptyState text="No assets added" />}
        {assets.map((a) => (
          <Card key={a.id}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{a.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-success">{formatCurrency(a.value, a.currency)}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { deleteAsset(a.id); toast.success('Deleted'); }}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </Section>
    </AppLayout>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground text-center py-4">{text}</p>;
}

function AddBankDialog({ onAdd }: { onAdd: (a: Omit<BankAccount, 'id'>) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'savings' | 'current' | 'salary'>('savings');
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('INR');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name, type, balance, currency });
    setName(''); setBalance(0); setOpen(false);
    toast.success('Account added');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="h-3 w-3" /> Add Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Savings" /></div>
          <div><Label>Type</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Balance</Label><Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} /></div>
          <div><Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="w-full">Add Account</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddCardDialog({ onAdd }: { onAdd: (c: Omit<CreditCardType, 'id'>) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('INR');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name, limit, outstanding, dueDate, currency });
    setName(''); setLimit(0); setOutstanding(0); setDueDate(''); setOpen(false);
    toast.success('Card added');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="h-3 w-3" /> Add Card</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Credit Card</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ICICI Amazon Pay" /></div>
          <div><Label>Credit Limit</Label><Input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></div>
          <div><Label>Outstanding</Label><Input type="number" value={outstanding} onChange={(e) => setOutstanding(Number(e.target.value))} /></div>
          <div><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div><Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="w-full">Add Card</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddAssetDialog({ onAdd }: { onAdd: (a: Omit<Asset, 'id'>) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'property' | 'investment' | 'vehicle' | 'other'>('property');
  const [value, setValue] = useState(0);
  const [currency, setCurrency] = useState('INR');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name, type, value, currency });
    setName(''); setValue(0); setOpen(false);
    toast.success('Asset added');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="h-3 w-3" /> Add Asset</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apartment in Mumbai" /></div>
          <div><Label>Type</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Value</Label><Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} /></div>
          <div><Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="w-full">Add Asset</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
