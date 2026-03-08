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
        <h1 className="text-xl font-semibold text-foreground">Transactions</h1>
        <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="pl-9"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={cn(
              'px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors capitalize',
              typeFilter === f
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">No transactions found.</p>
      ) : (
        <Card>
          <CardContent className="py-1">
            <div className="divide-y divide-border">
              {filtered.map((t) => {
                const cat = getCategoryInfo(t.category);
                return (
                  <div key={t.id} className="group flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">{cat.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {cat.label} · {format(new Date(t.date), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <p className={`text-sm font-medium tabular-nums ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
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
