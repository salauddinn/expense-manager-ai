/**
 * Transactions page — list, search, filter, edit, and export transactions.
 */

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TransactionRow } from '@/components/TransactionRow';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { ALL_CATEGORIES as CATEGORIES } from '@/lib/categories';
import { exportTransactionsCSV } from '@/lib/exportData';
import { Transaction, CategoryType, TransactionType } from '@/types/finance';
import { Trash2, Search, Download, Pencil, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FILTERS = ['all', 'income', 'expense'] as const;

export default function Transactions() {
  const { transactions, deleteTransaction, updateTransaction } = useTransactions();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success('Transaction deleted');
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    exportTransactionsCSV(filtered);
    toast.success('CSV downloaded!');
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Transactions</h1>
        <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5 text-muted-foreground hover:text-foreground text-xs">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="pl-10 rounded-xl h-11 bg-card"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={cn(
              'px-4 py-1.5 text-xs font-semibold rounded-full transition-all capitalize',
              typeFilter === f
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm mb-3">
            {transactions.length === 0 ? 'No transactions yet' : 'No transactions found'}
          </p>
          {transactions.length === 0 && (
            <Link to="/chat">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
                <MessageSquare className="h-3.5 w-3.5" /> Add via Chat
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-1 px-4">
            <div className="divide-y divide-border">
              {filtered.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onClick={() => setEditingTransaction(t)}
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setEditingTransaction(t); }}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        }
                        title="Delete transaction?"
                        description={`"${t.description}" — ${formatCurrency(t.amount, t.currency)}`}
                        onConfirm={() => handleDelete(t.id)}
                      />
                    </>
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={(updates) => {
            updateTransaction(editingTransaction.id, updates);
            setEditingTransaction(null);
            toast.success('Transaction updated');
          }}
          onDelete={() => {
            handleDelete(editingTransaction.id);
            setEditingTransaction(null);
          }}
        />
      )}
    </AppLayout>
  );
}

// ── Edit Dialog ──

function EditTransactionDialog({
  transaction,
  onClose,
  onSave,
  onDelete,
}: {
  transaction: Transaction;
  onClose: () => void;
  onSave: (updates: Partial<Transaction>) => void;
  onDelete: () => void;
}) {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount);
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState<CategoryType>(transaction.category);
  const [date, setDate] = useState(transaction.date.slice(0, 10));
  const [currency, setCurrency] = useState(transaction.currency);

  const handleSave = () => {
    if (!description.trim()) return;
    onSave({ type, amount, description, category, date: new Date(date).toISOString(), currency });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 rounded-xl h-11">Save Changes</Button>
            <Button variant="destructive" onClick={onDelete} className="rounded-xl h-11">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
