/**
 * Accounts / "More" page — Quick links, bank accounts, credit cards, assets, and backup.
 */

import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Section, EmptyState } from '@/components/shared/Section';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAssets } from '@/hooks/useAssets';
import { formatCurrency } from '@/lib/currencies';
import { exportBackup, importBackup } from '@/lib/backup';
import { AddBankDialog, AddCardDialog, AddAssetDialog } from '@/components/AddEntityDialogs';
import { Trash2, ChevronRight, Calculator, List, CircleDollarSign, Download as DownloadIcon, Upload, MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function Accounts() {
  const { accounts, addAccount, deleteAccount } = useBankAccounts();
  const { cards, addCard, deleteCard } = useCreditCards();
  const { assets, addAsset, deleteAsset } = useAssets();
  const importRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importBackup(file);
    if (result.success) {
      toast.success(`Restored ${result.keysRestored} data sets. Reloading...`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error('Invalid backup file');
    }
    e.target.value = '';
  };

  return (
    <AppLayout>
      <h1 className="text-xl font-bold text-foreground tracking-tight mb-5">More</h1>

      {/* Quick Links */}
      <Section title="Quick Links">
        <Card>
          <CardContent className="py-1 px-4">
            <div className="divide-y divide-border">
              <QuickLink to="/transactions" icon={<List className="h-4 w-4" />} label="Transaction History" />
              <QuickLink to="/recurring" icon={<RefreshCw className="h-4 w-4" />} label="Recurring Transactions" />
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
        {accounts.length === 0 && (
          <div className="text-center py-8">
            <EmptyState text="No bank accounts added" />
            <Link to="/chat">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-full mt-2">
                <MessageSquare className="h-3.5 w-3.5" /> Add via Chat
              </Button>
            </Link>
          </div>
        )}
        {accounts.length > 0 && (
          <Card>
            <CardContent className="py-1 px-4">
              <div className="divide-y divide-border">
                {accounts.map((a) => (
                  <div key={a.id} className="group flex items-center justify-between py-3 -mx-4 px-4">
                    <Link to={`/accounts/${a.id}`} className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{a.type}</p>
                    </Link>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(a.balance, a.currency)}</p>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        }
                        title={`Delete "${a.name}"?`}
                        description="This will remove the account. Linked transactions will not be deleted."
                        onConfirm={() => { deleteAccount(a.id); toast.success('Account deleted'); }}
                      />
                      <Link to={`/accounts/${a.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* Credit Cards */}
      <Section title="Credit Cards">
        <AddCardDialog onAdd={addCard} />
        {cards.length === 0 && (
          <div className="text-center py-8">
            <EmptyState text="No credit cards added" />
            <Link to="/chat">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-full mt-2">
                <MessageSquare className="h-3.5 w-3.5" /> Add via Chat
              </Button>
            </Link>
          </div>
        )}
        {cards.length > 0 && (
          <Card>
            <CardContent className="py-1 px-4">
              <div className="divide-y divide-border">
                {cards.map((c) => (
                  <div key={c.id} className="group flex items-center justify-between py-3 -mx-4 px-4">
                    <Link to={`/accounts/${c.id}`} className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Limit: {formatCurrency(c.limit, c.currency)}
                        {c.dueDate && ` · Due: ${c.dueDate}`}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium tabular-nums text-destructive">{formatCurrency(c.outstanding, c.currency)}</p>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        }
                        title={`Delete "${c.name}"?`}
                        description="This will remove the credit card. Linked transactions will not be deleted."
                        onConfirm={() => { deleteCard(c.id); toast.success('Card deleted'); }}
                      />
                      <Link to={`/accounts/${c.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* Assets */}
      <Section title="Assets">
        <AddAssetDialog onAdd={addAsset} />
        {assets.length === 0 && (
          <div className="text-center py-8">
            <EmptyState text="No assets added" />
            <Link to="/chat">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-full mt-2">
                <MessageSquare className="h-3.5 w-3.5" /> Add via Chat
              </Button>
            </Link>
          </div>
        )}
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
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        }
                        title={`Delete "${a.name}"?`}
                        description="This will permanently remove this asset."
                        onConfirm={() => { deleteAsset(a.id); toast.success('Deleted'); }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* Backup & Restore */}
      <Section title="Data">
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full flex-1"
            onClick={() => { exportBackup(); toast.success('Backup downloaded'); }}
          >
            <DownloadIcon className="h-3.5 w-3.5" /> Export Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full flex-1"
            onClick={() => importRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> Restore Backup
          </Button>
        </div>
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
