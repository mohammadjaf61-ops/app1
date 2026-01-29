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
  if (!params) {
    return text;
  }

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

// ============================================
// IRAQ LOCAL DATE FORMATS
// ============================================

/**
 * Date format options for Iraq
 * Iraq uses Gregorian calendar primarily
 * Hijri calendar shown as secondary (placeholder for future implementation)
 */
export type IraqDateFormat = 'short' | 'medium' | 'long' | 'full' | 'datetime' | 'time';

/**
 * Format date for Iraq locale (ar-IQ)
 * Uses Gregorian calendar as primary
 *
 * @param date - Date to format
 * @param format - Format style
 * @returns Formatted date string
 */
export function formatDateIraq(
  date: Date | string | number,
  format: IraqDateFormat = 'medium',
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const formatOptions: Record<IraqDateFormat, Intl.DateTimeFormatOptions> = {
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    medium: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    },
    full: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    },
    datetime: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
    },
  };

  return new Intl.DateTimeFormat('ar-IQ', formatOptions[format]).format(d);
}

/**
 * Format date with Hijri calendar (Islamic)
 * Placeholder implementation - for future integration with proper Hijri library
 *
 * @param date - Date to format
 * @param format - Format style
 * @returns Formatted Hijri date string
 */
export function formatDateHijri(
  date: Date | string | number,
  format: IraqDateFormat = 'medium',
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  // Use Intl with islamic-umalqura calendar
  // Note: Browser support varies, may need polyfill
  const formatOptions: Record<IraqDateFormat, Intl.DateTimeFormatOptions> = {
    short: {
      calendar: 'islamic-umalqura',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    medium: {
      calendar: 'islamic-umalqura',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    long: {
      calendar: 'islamic-umalqura',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    },
    full: {
      calendar: 'islamic-umalqura',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    },
    datetime: {
      calendar: 'islamic-umalqura',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
    },
  };

  try {
    return new Intl.DateTimeFormat('ar-IQ', formatOptions[format]).format(d);
  } catch {
    // Fallback if islamic calendar not supported
    return formatDateIraq(date, format) + ' (هـ)';
  }
}

/**
 * Format date with both Gregorian and Hijri
 * Example: "29 يناير 2026 م | 29 رجب 1447 هـ"
 *
 * @param date - Date to format
 * @returns Combined Gregorian and Hijri date string
 */
export function formatDateDual(date: Date | string | number): string {
  const gregorian = formatDateIraq(date, 'medium');
  const hijri = formatDateHijri(date, 'medium');
  return `${gregorian} م | ${hijri} هـ`;
}

/**
 * Get Iraq timezone date
 * Iraq timezone is AST (Arabia Standard Time) = UTC+3
 */
export function getIraqDate(date?: Date | string | number): Date {
  const d = date
    ? typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date
    : new Date();

  // Convert to Iraq timezone
  return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Baghdad' }));
}

/**
 * Format time in 12-hour format (common in Iraq)
 */
export function formatTimeIraq(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat('ar-IQ', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Iraqi day names
 */
export const iraqDayNames = {
  SUNDAY: 'الأحد',
  MONDAY: 'الإثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت',
} as const;

/**
 * Iraqi month names (Gregorian)
 */
export const iraqMonthNames = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

/**
 * Hijri month names
 */
export const hijriMonthNames = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
] as const;
