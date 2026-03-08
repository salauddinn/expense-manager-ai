import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Trash2, ChevronRight, Calculator, List, CircleDollarSign, Download as DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Accounts() {
  const { accounts, addAccount, deleteAccount } = useBankAccounts();
  const { cards, addCard, deleteCard } = useCreditCards();
  const { assets, addAsset, deleteAsset } = useAssets();

  return (
    <AppLayout>
      <h1 className="text-xl font-bold text-foreground tracking-tight mb-5">More</h1>

      {/* Quick Links */}
      <div className="mb-6">
        <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Links</h2>
        <Card>
          <CardContent className="py-1 px-4">
            <div className="divide-y divide-border">
              <QuickLink to="/transactions" icon={<List className="h-4 w-4" />} label="Transaction History" />
              <QuickLink to="/budget" icon={<CircleDollarSign className="h-4 w-4" />} label="Budget Goals" />
              <QuickLink to="/loan-calculator" icon={<Calculator className="h-4 w-4" />} label="Loan Calculator" />
              <QuickLink to="/install" icon={<DownloadIcon className="h-4 w-4" />} label="Install App" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts */}
      <Section title="Bank Accounts">
        <AddBankDialog onAdd={addAccount} />
        {accounts.length === 0 && <EmptyState text="No bank accounts added" />}
        {accounts.length > 0 && (
          <Card>
            <CardContent className="py-1 px-4">
              <div className="divide-y divide-border">
                {accounts.map((a) => (
                  <Link key={a.id} to={`/accounts/${a.id}`} className="group flex items-center justify-between py-3 -mx-4 px-4 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{a.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(a.balance, a.currency)}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* Credit Cards */}
      <Section title="Credit Cards">
        <AddCardDialog onAdd={addCard} />
        {cards.length === 0 && <EmptyState text="No credit cards added" />}
        {cards.length > 0 && (
          <Card>
            <CardContent className="py-1 px-4">
              <div className="divide-y divide-border">
                {cards.map((c) => (
                  <Link key={c.id} to={`/accounts/${c.id}`} className="group flex items-center justify-between py-3 -mx-4 px-4 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Limit: {formatCurrency(c.limit, c.currency)}
                        {c.dueDate && ` · Due: ${c.dueDate}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium tabular-nums text-destructive">{formatCurrency(c.outstanding, c.currency)}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* Assets */}
      <Section title="Assets">
        <AddAssetDialog onAdd={addAsset} />
        {assets.length === 0 && <EmptyState text="No assets added" />}
        {assets.length > 0 && (
          <Card>
            <CardContent className="py-1 px-4">
              <div className="divide-y divide-border">
                {assets.map((a) => (
                  <div key={a.id} className="group flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{a.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium tabular-nums text-success">{formatCurrency(a.value, a.currency)}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { deleteAsset(a.id); toast.success('Deleted'); }}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Section>
    </AppLayout>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground text-center py-6">{text}</p>;
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
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1.5 text-muted-foreground"><Plus className="h-3 w-3" /> Add Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Savings" /></div>
          <div className="space-y-1.5"><Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'savings' | 'current' | 'salary')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Balance</Label><Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="w-full rounded-xl h-11">Add Account</Button>
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
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1.5 text-muted-foreground"><Plus className="h-3 w-3" /> Add Card</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Credit Card</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ICICI Amazon Pay" /></div>
          <div className="space-y-1.5"><Label>Credit Limit</Label><Input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Outstanding</Label><Input type="number" value={outstanding} onChange={(e) => setOutstanding(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="w-full rounded-xl h-11">Add Card</Button>
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
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1.5 text-muted-foreground"><Plus className="h-3 w-3" /> Add Asset</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apartment in Mumbai" /></div>
          <div className="space-y-1.5"><Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'property' | 'investment' | 'vehicle' | 'other')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Value</Label><Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="w-full rounded-xl h-11">Add Asset</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
