import { BottomNav } from './BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LLMSettingsDialog } from '@/components/LLMSettingsDialog';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 py-2">
          <h2 className="text-sm font-semibold text-foreground">💰 FinTrack</h2>
          <div className="flex items-center gap-1">
            <LLMSettingsDialog />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
