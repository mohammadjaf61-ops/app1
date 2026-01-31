import { ar, en, DEFAULT_LOCALE, getLocaleDirection, type Locale } from '@hypermarket/i18n';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

function getDeviceLocale(): Locale {
  const deviceLocale = Localization.locale?.split('-')[0];
  if (deviceLocale === 'en') {
    return 'en';
  }
  return DEFAULT_LOCALE;
}

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: getDeviceLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export function configureRTL(locale: Locale): void {
  const isRTL = getLocaleDirection(locale) === 'rtl';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
}

configureRTL(i18n.language as Locale);

i18n.on('languageChanged', (lng) => {
  configureRTL(lng as Locale);
});

export default i18n;
export { getDeviceLocale };
