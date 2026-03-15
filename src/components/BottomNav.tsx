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
      className="fixed bottom-0 left-0 right-0 safe-area-bottom"
      style={{
        height: '60px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="touch-target"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                color: isActive ? '#5095AC' : '#8E9BA3',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={22} />
              <span
                style={{
                  fontFamily: "'Merriweather Sans', sans-serif",
                  fontSize: '10px',
                  fontWeight: 500,
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#5095AC',
                    marginTop: '1px',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
