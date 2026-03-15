import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Apple, BarChart3, Settings } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

const allTabs = [
  { path: '/', label: 'Idag', icon: Home, always: true },
  { path: '/schedule', label: 'Schema', icon: Calendar, always: true },
  { path: '/nutrition', label: 'Kost', icon: Apple, key: 'nutrition' },
  { path: '/dashboard', label: 'Översikt', icon: BarChart3, always: true },
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="mx-auto flex max-w-[480px] items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="touch-target flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200"
              style={{
                color: isActive ? '#5095AC' : '#8E9BA3',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span
                  className="mt-0.5 h-1 w-1 rounded-full"
                  style={{ background: '#5095AC' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
