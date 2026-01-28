/**
 * i18n Utility Functions
 */

import type { InterpolationParams } from './types';

/**
 * Simple interpolation function
 * Replaces {{key}} patterns with values from params
 *
 * @example
 * interpolate('Hello {{name}}!', { name: 'World' }) // 'Hello World!'
 * interpolate('{{count}} items', { count: 5 }) // '5 items'
 */
export function interpolate(text: string, params?: InterpolationParams): string {
  if (!params) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

/**
 * Get nested value from object by dot-notation path
 *
 * @example
 * getNestedValue({ a: { b: 'value' } }, 'a.b') // 'value'
 */
export function getNestedValue<T = string>(
  obj: Record<string, unknown>,
  path: string,
): T | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency (IQD - Iraqi Dinar)
 */
export function formatCurrency(value: number, locale: string = 'ar-IQ'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format date with locale-specific formatting
 */
export function formatDate(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string | number, locale: string = 'ar'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDay > 0) {
    return rtf.format(-diffDay, 'day');
  }
  if (diffHour > 0) {
    return rtf.format(-diffHour, 'hour');
  }
  if (diffMin > 0) {
    return rtf.format(-diffMin, 'minute');
  }
  return rtf.format(-diffSec, 'second');
}
