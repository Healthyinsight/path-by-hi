import { useTranslation } from 'react-i18next';

export function LanguageFlagButton() {
  const { i18n } = useTranslation();
  const isSv = i18n.language.startsWith('sv');

  const toggle = () => {
    void i18n.changeLanguage(isSv ? 'en' : 'sv');
  };

  return (
    <button
      onClick={toggle}
      title={isSv ? 'Switch to English' : 'Byt till svenska'}
      style={{
        position: 'fixed',
        top: '12px',
        right: '12px',
        zIndex: 1100,
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        lineHeight: 1,
        padding: 0,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.10)';
      }}
    >
      {isSv ? '🇸🇪' : '🇬🇧'}
    </button>
  );
}
