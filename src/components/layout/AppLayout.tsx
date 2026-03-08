import { BottomNav } from './BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LLMSettingsDialog } from '@/components/LLMSettingsDialog';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">F</span>
            </div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">FinTrack</h2>
          </div>
          <div className="flex items-center gap-0.5">
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
