/**
 * useT - Translation hook for Customer App
 * Provides type-safe access to translations
 */

import {
  type Locale,
  type InterpolationParams,
  getLocaleDirection,
  LOCALES,
} from '@hypermarket/i18n';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '@/lib/i18n';

/**
 * Translation hook with locale utilities
 */
export function useT() {
  const { t, i18n: i18nInstance } = useTranslation();
  const currentLocale = i18nInstance.language as Locale;

  /**
   * Translate a key with optional interpolation
   */
  const translate = useCallback(
    (key: string, params?: InterpolationParams): string => {
      return t(key, params as Record<string, string | number>);
    },
    [t],
  );

  /**
   * Change language
   */
  const changeLanguage = useCallback(async (locale: Locale): Promise<void> => {
    await i18n.changeLanguage(locale);
  }, []);

  /**
   * Get current text direction
   */
  const direction = getLocaleDirection(currentLocale);

  /**
   * Check if current locale is RTL
   */
  const isRTL = direction === 'rtl';

  return {
    t: translate,
    locale: currentLocale,
    direction,
    isRTL,
    changeLanguage,
    locales: LOCALES,
  };
}

export default useT;
