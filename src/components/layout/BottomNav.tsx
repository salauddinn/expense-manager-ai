import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, PieChart, Target, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/insights', label: 'Insights', icon: PieChart },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/accounts', label: 'More', icon: Wallet },
];

export function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/40">
      <div className="mx-auto flex max-w-2xl items-center justify-around py-1.5 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-all rounded-xl',
                active
                  ? 'text-primary bg-primary/8'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.5} />
              {label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
