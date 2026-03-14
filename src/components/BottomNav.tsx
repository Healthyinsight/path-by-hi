import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Apple, TrendingUp, Settings } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

const allTabs = [
  { path: '/', label: 'Hem', icon: Home, always: true },
  { path: '/schedule', label: 'Schema', icon: Calendar, always: true },
  { path: '/nutrition', label: 'Kost', icon: Apple, key: 'nutrition' },
  { path: '/progress', label: 'Progress', icon: TrendingUp, always: true },
  { path: '/settings', label: 'Inställningar', icon: Settings, always: true },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const tabs = allTabs.filter(tab => {
    if (tab.always) return true;
    if (tab.key === 'nutrition') return profile?.show_nutrition !== false;
    return true;
  });

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
