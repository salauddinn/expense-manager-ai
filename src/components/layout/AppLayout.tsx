import { BottomNav } from './BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LLMSettingsDialog } from '@/components/LLMSettingsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
