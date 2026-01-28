/**
 * @hypermarket/i18n
 * Internationalization support for the hypermarket platform
 * Arabic-first, extensible to other languages
 */

// Types
export type {
  TranslationResources,
  Locale,
  TranslationNamespace,
  TranslationKey,
  InterpolationParams,
  TranslateFunction,
  I18nConfig,
} from './types';

export { DEFAULT_LOCALE, LOCALES, DEFAULT_I18N_CONFIG, getLocaleDirection, isRtl } from './types';

// Utilities
export {
  interpolate,
  getNestedValue,
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
} from './utils';

// Re-export locales for convenience (they can also be imported directly)
import ar from './locales/ar.json';
import en from './locales/en.json';

export const locales = {
  ar,
  en,
} as const;

export { ar, en };
