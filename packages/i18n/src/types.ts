/**
 * i18n Types
 */

import type ar from './locales/ar.json';

/**
 * Translation resource type derived from Arabic (primary) locale
 */
export type TranslationResources = typeof ar;

/**
 * Supported locales
 */
export type Locale = 'ar' | 'en';

/**
 * Default locale (Arabic-first)
 */
export const DEFAULT_LOCALE: Locale = 'ar';

/**
 * Available locales configuration
 */
export const LOCALES: Record<Locale, { name: string; nativeName: string; dir: 'rtl' | 'ltr' }> = {
  ar: { name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
};

/**
 * Get text direction for locale
 */
export function getLocaleDirection(locale: Locale): 'rtl' | 'ltr' {
  return LOCALES[locale]?.dir ?? 'rtl';
}

/**
 * Check if locale is RTL
 */
export function isRtl(locale: Locale): boolean {
  return getLocaleDirection(locale) === 'rtl';
}

/**
 * Translation namespace keys
 */
export type TranslationNamespace = keyof TranslationResources;

/**
 * Get nested key paths for type-safe translations
 * Example: 'common.loading' | 'auth.login' | etc.
 */
export type TranslationKey<NS extends TranslationNamespace = TranslationNamespace> =
  NS extends keyof TranslationResources ? `${NS}.${StringKeyOf<TranslationResources[NS]>}` : never;

/**
 * Helper type to get string keys of an object (excluding nested objects for simplicity)
 */
type StringKeyOf<T> = Extract<keyof T, string>;

/**
 * Interpolation parameters for translation strings
 * Matches {{param}} patterns in translation strings
 */
export interface InterpolationParams {
  [key: string]: string | number;
}

/**
 * Translation function type
 */
export type TranslateFunction = (key: string, params?: InterpolationParams) => string;

/**
 * i18n configuration options
 */
export interface I18nConfig {
  locale: Locale;
  fallbackLocale: Locale;
  debug?: boolean;
}

/**
 * Default i18n configuration
 */
export const DEFAULT_I18N_CONFIG: I18nConfig = {
  locale: DEFAULT_LOCALE,
  fallbackLocale: 'ar',
  debug: false,
};
