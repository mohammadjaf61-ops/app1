/**
 * i18n Configuration for Admin Web
 * Arabic-first, with English fallback
 */

import {
  ar,
  en,
  DEFAULT_LOCALE,
  type Locale,
} from '@hypermarket/i18n';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Detect locale from browser or localStorage
function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('locale');
    if (stored === 'en' || stored === 'ar') {
      return stored;
    }
    const browserLocale = navigator.language?.split('-')[0];
    if (browserLocale === 'en') return 'en';
  }
  return DEFAULT_LOCALE; // Arabic by default
}

// Initialize i18n
i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: getInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// Persist locale changes
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', lng);
    // Update document direction
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  }
});

export default i18n;
export { getInitialLocale };
