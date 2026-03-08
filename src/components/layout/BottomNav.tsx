import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, List, Target, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/transactions', label: 'History', icon: List },
  { to: '/budget', label: 'Budget', icon: Target },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
];

export function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-2xl items-center justify-around py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium transition-colors rounded-lg',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.5} />
              {label}
              {active && (
                <span className="h-1 w-1 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
