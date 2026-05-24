import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageFlagButton() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isSv = i18n.language.startsWith('sv');

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const buttonBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Merriweather Sans', sans-serif",
    textAlign: 'left' as const,
  };

  return (
    <div ref={ref} style={{ position: 'fixed', top: '12px', right: '12px', zIndex: 1100 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title={isSv ? 'Byt språk' : 'Change language'}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '9px',
          border: '1px solid rgba(0,0,0,0.09)',
          background: open ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: open
            ? '0 4px 16px rgba(0,0,0,0.14)'
            : '0 1px 4px rgba(0,0,0,0.10)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          lineHeight: 1,
          padding: 0,
          transition: 'box-shadow 0.15s ease, background 0.15s ease',
        }}
      >
        {isSv ? '🇸🇪' : '🇬🇧'}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
            overflow: 'hidden',
            minWidth: '148px',
          }}
        >
          <button
            onClick={() => { void i18n.changeLanguage('sv'); setOpen(false); }}
            style={{
              ...buttonBase,
              background: isSv ? 'rgba(80,149,172,0.08)' : 'transparent',
              color: isSv ? '#5095AC' : '#374151',
              fontWeight: isSv ? 600 : 400,
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>🇸🇪</span>
            Svenska
          </button>

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 12px' }} />

          <button
            onClick={() => { void i18n.changeLanguage('en'); setOpen(false); }}
            style={{
              ...buttonBase,
              background: !isSv ? 'rgba(80,149,172,0.08)' : 'transparent',
              color: !isSv ? '#5095AC' : '#374151',
              fontWeight: !isSv ? 600 : 400,
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>🇬🇧</span>
            English
          </button>
        </div>
      )}
    </div>
  );
}
