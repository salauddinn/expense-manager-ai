import { BottomNav } from './BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LLMSettingsDialog } from '@/components/LLMSettingsDialog';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-5 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">FinTrack</h2>
          <div className="flex items-center gap-1">
            <LLMSettingsDialog />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 pt-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
