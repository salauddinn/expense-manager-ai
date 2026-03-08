/**
 * Accounts / "More" page — Quick links, bank accounts, credit cards, and assets.
 */

import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Section, EmptyState } from '@/components/shared/Section';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAssets } from '@/hooks/useAssets';
import { formatCurrency } from '@/lib/currencies';
import { AddBankDialog, AddCardDialog, AddAssetDialog } from '@/components/AddEntityDialogs';
import { Trash2, ChevronRight, Calculator, List, CircleDollarSign, Download as DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Accounts() {
  const { accounts, addAccount } = useBankAccounts();
  const { cards, addCard } = useCreditCards();
  const { assets, addAsset, deleteAsset } = useAssets();

  return (
    <AppLayout>
      <h1 className="text-xl font-bold text-foreground tracking-tight mb-5">More</h1>

      {/* Quick Links */}
      <Section title="Quick Links">
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
      </Section>

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
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); deleteAsset(a.id); toast.success('Deleted'); }}>
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

// ── Sub-components ──

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
