import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Apple, TrendingUp, Settings } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Hem', icon: Home },
  { path: '/schedule', label: 'Schema', icon: Calendar },
  { path: '/nutrition', label: 'Kost', icon: Apple },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/settings', label: 'Inställningar', icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-muted/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[480px] items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`touch-target flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
