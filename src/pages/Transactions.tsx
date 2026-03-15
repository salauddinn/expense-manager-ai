/**
 * Transactions page — list, search, filter, edit, and export transactions.
 */

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TransactionRow } from '@/components/TransactionRow';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { ALL_CATEGORIES as CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/categories';
import { exportTransactionsCSV } from '@/lib/exportData';
import { Transaction, CategoryType, TransactionType } from '@/types/finance';
import { Trash2, Search, Download, Pencil, MessageSquare, Plus, Filter, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const TYPE_FILTERS = ['all', 'income', 'expense'] as const;

interface FilterState {
  type: string;
  categories: string[];
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  categories: [],
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

function hasActiveFilters(f: FilterState) {
  return (
    f.type !== 'all' ||
    f.categories.length > 0 ||
    f.dateFrom !== '' ||
    f.dateTo !== '' ||
    f.amountMin !== '' ||
    f.amountMax !== ''
  );
}

export default function Transactions() {
  const { transactions, isLoading, deleteTransaction, updateTransaction, addTransaction } = useTransactions();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());

      const matchesType = filters.type === 'all' || t.type === filters.type;

      const matchesCategory = filters.categories.length === 0 || filters.categories.includes(t.category);

      const txDate = new Date(t.date);
      const matchesDateFrom = !filters.dateFrom || txDate >= startOfDay(parseISO(filters.dateFrom));
      const matchesDateTo = !filters.dateTo || txDate <= endOfDay(parseISO(filters.dateTo));

      const matchesAmountMin = !filters.amountMin || t.amount >= parseFloat(filters.amountMin);
      const matchesAmountMax = !filters.amountMax || t.amount <= parseFloat(filters.amountMax);

      return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
    });
  }, [transactions, search, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.categories.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.amountMin || filters.amountMax) count++;
    return count;
  }, [filters]);

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

  const toggleCategory = (cat: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
  };

  const categoryOptions = filters.type === 'income'
    ? INCOME_CATEGORIES
    : filters.type === 'expense'
    ? EXPENSE_CATEGORIES
    : CATEGORIES;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Transactions</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5 text-muted-foreground hover:text-foreground text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <AddTransactionDialog onAdd={addTransaction} />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="pl-10 pr-10 rounded-xl h-11 bg-card"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilters((prev) => ({ ...prev, type: f, categories: [] }))}
            className={cn(
              'px-4 py-1.5 text-xs font-semibold rounded-full transition-all capitalize',
              filters.type === f
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border',
            )}
          >
            {f}
          </button>
        ))}

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border',
                activeFilterCount > 0
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border',
              )}
            >
              <Filter className="h-3 w-3" />
              Filters
              {activeFilterCount > 0 && (
                <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Advanced Filters</p>
                {hasActiveFilters(filters) && (
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Date range */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">From</p>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">To</p>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Amount range */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Amount Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Min</p>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.amountMin}
                      onChange={(e) => setFilters((prev) => ({ ...prev, amountMin: e.target.value }))}
                      className="h-9 text-xs"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Max</p>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={filters.amountMax}
                      onChange={(e) => setFilters((prev) => ({ ...prev, amountMax: e.target.value }))}
                      className="h-9 text-xs"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Categories</Label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={cn(
                        'px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all',
                        filters.categories.includes(cat.value)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50',
                      )}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                className="w-full rounded-lg"
                onClick={() => setFilterOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {(hasActiveFilters(filters) || search) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {transactions.length > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          {filtered.length} of {transactions.length} transactions
          {filtered.length !== transactions.length && ' (filtered)'}
        </p>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 opacity-30" strokeWidth={1.5} />
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">
            {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
          </p>
          <p className="text-xs text-muted-foreground/70 mb-4">
            {transactions.length === 0
              ? 'Start by adding your first transaction'
              : 'Try adjusting your search or filters'}
          </p>
          {transactions.length === 0 ? (
            <Link to="/chat">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
                <MessageSquare className="h-3.5 w-3.5" /> Add via Chat
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" /> Clear Filters
            </Button>
          )}
        </div>
      ) : !isLoading ? (
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
      ) : null}

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
  const [cashback, setCashback] = useState(transaction.cashback ?? 0);

  const handleSave = () => {
    if (!description.trim()) return;
    onSave({ type, amount, description, category, date: new Date(date).toISOString(), currency, cashback: cashback || undefined });
  };

  const categoryOptions = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => { setType(v as TransactionType); setCategory(v === 'income' ? 'salary' : 'food'); }}>
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
            <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
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
          {type === 'expense' && (
            <div className="space-y-1.5">
              <Label>Cashback</Label>
              <Input type="number" inputMode="decimal" value={cashback} onChange={(e) => setCashback(Number(e.target.value))} placeholder="0" />
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 rounded-xl h-11">Save Changes</Button>
            <ConfirmDialog
              trigger={
                <Button variant="destructive" className="rounded-xl h-11 px-4">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title="Delete this transaction?"
              description={`"${transaction.description}" — ${formatCurrency(transaction.amount, transaction.currency)}`}
              onConfirm={onDelete}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
