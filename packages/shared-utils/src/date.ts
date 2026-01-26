/**
 * Date formatting utilities for Iraq timezone (Asia/Baghdad)
 */

const IRAQ_TIMEZONE = 'Asia/Baghdad';

/**
 * Format date in Arabic locale
 * Example: "٢٥ كانون الثاني ٢٠٢٥"
 */
export function formatDateArabic(date: Date): string {
  return new Intl.DateTimeFormat('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: IRAQ_TIMEZONE,
  }).format(date);
}

/**
 * Format date and time in Arabic locale
 * Example: "٢٥ كانون الثاني ٢٠٢٥ ٠٢:٣٠ م"
 */
export function formatDateTimeArabic(date: Date): string {
  return new Intl.DateTimeFormat('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: IRAQ_TIMEZONE,
  }).format(date);
}

/**
 * Format time only in Arabic
 * Example: "٠٢:٣٠ م"
 */
export function formatTimeArabic(date: Date): string {
  return new Intl.DateTimeFormat('ar-IQ', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: IRAQ_TIMEZONE,
  }).format(date);
}

/**
 * Format date in short format
 * Example: "25/01/2025"
 */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: IRAQ_TIMEZONE,
  }).format(date);
}

/**
 * Format date for API (ISO format)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString();
}

/**
 * Get relative time in Arabic
 * Example: "منذ ٥ دقائق"
 */
export function getRelativeTimeArabic(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('ar-IQ', { numeric: 'auto' });
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  const intervals: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
    if (count >= 1) {
      return rtf.format(diffInSeconds > 0 ? count : -count, interval.unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Get start of day in Iraq timezone
 */
export function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day in Iraq timezone
 */
export function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
