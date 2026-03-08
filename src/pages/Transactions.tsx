import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import { exportTransactionsCSV } from '@/lib/exportData';
import { format } from 'date-fns';
import { Trash2, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FILTERS = ['all', 'income', 'expense'] as const;

export default function Transactions() {
  const { transactions, deleteTransaction } = useTransactions();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
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
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16 text-sm">No transactions found.</p>
      ) : (
        <Card>
          <CardContent className="py-1 px-4">
            <div className="divide-y divide-border">
              {filtered.map((t) => {
                const cat = getCategoryInfo(t.category);
                return (
                  <div key={t.id} className="group flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-base shrink-0">
                        {cat.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{t.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {cat.label} · {format(new Date(t.date), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <p className={`text-sm font-bold tabular-nums ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount, t.currency)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
