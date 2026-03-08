import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/currencies';
import { Transaction, TransactionType } from '@/types/finance';
import { ArrowLeft, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { useState, useMemo } from 'react';

type Filter = 'all' | 'income' | 'expense';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const { accounts } = useBankAccounts();
  const { cards } = useCreditCards();
  const { transactions } = useTransactions();
  const [filter, setFilter] = useState<Filter>('all');

  const account = accounts.find((a) => a.id === id);
  const card = cards.find((c) => c.id === id);
  const entity = account || card;

  const linkedTransactions = useMemo(() => {
    if (!id) return [];
    return transactions.filter(
      (t) => t.linkedAccountId === id || t.linkedCardId === id
    );
  }, [transactions, id]);

  const filtered = useMemo(() => {
    if (filter === 'all') return linkedTransactions;
    return linkedTransactions.filter((t) => t.type === filter);
  }, [linkedTransactions, filter]);

  const stats = useMemo(() => {
    const income = linkedTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = linkedTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, count: linkedTransactions.length };
  }, [linkedTransactions]);

  if (!entity) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">Account not found</p>
          <Link to="/accounts" className="text-primary text-sm mt-2 inline-block">← Back to accounts</Link>
        </div>
      </AppLayout>
    );
  }

  const currency = entity.currency;
  const isCard = !!card;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Link to="/accounts">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">{entity.name}</h1>
      </div>

      {/* Account Info Card */}
      <Card className="mb-5">
        <CardContent className="py-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {isCard ? 'Outstanding' : 'Balance'}
              </p>
              <p className={`text-2xl font-bold tabular-nums ${isCard ? 'text-destructive' : 'text-foreground'}`}>
                {formatCurrency(isCard ? card!.outstanding : account!.balance, currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {isCard ? 'Limit' : 'Type'}
              </p>
              <p className="text-sm font-medium capitalize">
                {isCard ? formatCurrency(card!.limit, currency) : account!.type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <StatCard icon={<Receipt className="h-3.5 w-3.5" />} label="Transactions" value={String(stats.count)} />
        <StatCard icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />} label="Income" value={formatCurrency(stats.income, currency)} />
        <StatCard icon={<TrendingDown className="h-3.5 w-3.5 text-destructive" />} label="Spent" value={formatCurrency(stats.expense, currency)} />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-4">
        {(['all', 'income', 'expense'] as Filter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            className="text-xs capitalize rounded-full h-7 px-3"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          {linkedTransactions.length === 0
            ? 'No transactions linked to this account yet'
            : 'No matching transactions'}
        </p>
      ) : (
        <Card>
          <CardContent className="py-1 px-4">
            <div className="divide-y divide-border">
              {filtered.map((t) => (
                <TransactionRow key={t.id} transaction={t} currency={currency} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-3 px-3 text-center">
        <div className="flex justify-center mb-1">{icon}</div>
        <p className="text-xs font-semibold tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function TransactionRow({ transaction: t, currency }: { transaction: Transaction; currency: string }) {
  const isExpense = t.type === 'expense';
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{t.description || t.category}</p>
        <p className="text-[11px] text-muted-foreground capitalize">{t.category} · {t.date}</p>
      </div>
      <p className={`text-sm font-medium tabular-nums ${isExpense ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {isExpense ? '-' : '+'}{formatCurrency(t.amount, currency)}
      </p>
    </div>
  );
}
