import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { sv } from './locales/sv';
import { en } from './locales/en';

export const LOCALE_STORAGE_KEY = 'pathTracker.locale';

function getStoredLng(): string {
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === 'en' || v === 'sv') return v;
  } catch {
    /* ignore */
  }
  return 'sv';
}

void i18n.use(initReactI18next).init({
  resources: {
    sv: { translation: sv },
    en: { translation: en },
  },
  lng: getStoredLng(),
  fallbackLng: 'sv',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng === 'en' ? 'en' : 'sv';
  }
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language === 'en' ? 'en' : 'sv';
}

export default i18n;
