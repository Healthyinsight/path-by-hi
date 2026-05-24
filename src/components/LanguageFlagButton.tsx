import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const FLAGS = {
  sv: { src: 'https://flagcdn.com/24x18/se.png', label: 'Svenska' },
  en: { src: 'https://flagcdn.com/24x18/gb.png', label: 'English' },
};

function Flag({ lang, size = 24 }: { lang: 'sv' | 'en'; size?: number }) {
  const { src, label } = FLAGS[lang];
  return (
    <img
      src={src}
      alt={label}
      width={size}
      height={Math.round(size * 0.75)}
      style={{ display: 'block', borderRadius: '2px', flexShrink: 0 }}
    />
  );
}

export function LanguageFlagButton() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang: 'sv' | 'en' = i18n.language.startsWith('sv') ? 'sv' : 'en';

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectLang = (lang: 'sv' | 'en') => {
    void i18n.changeLanguage(lang);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'fixed', top: '12px', right: '12px', zIndex: 1100 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        title={currentLang === 'sv' ? 'Byt språk' : 'Change language'}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: '1px solid rgba(0,0,0,0.09)',
          background: open ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: open ? '0 4px 16px rgba(0,0,0,0.14)' : '0 1px 4px rgba(0,0,0,0.10)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: 'box-shadow 0.15s ease, background 0.15s ease',
        }}
      >
        <Flag lang={currentLang} size={26} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
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
          {(['sv', 'en'] as const).map((lang, i) => {
            const active = currentLang === lang;
            return (
              <div key={lang}>
                {i > 0 && (
                  <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 12px' }} />
                )}
                <button
                  onClick={() => selectLang(lang)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'rgba(80,149,172,0.08)' : 'transparent',
                    color: active ? '#5095AC' : '#374151',
                    fontWeight: active ? 600 : 400,
                    fontSize: '14px',
                    fontFamily: "'Merriweather Sans', sans-serif",
                    textAlign: 'left',
                    lineHeight: 1,
                  }}
                >
                  <Flag lang={lang} size={22} />
                  <span style={{ lineHeight: 1 }}>{FLAGS[lang].label}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
