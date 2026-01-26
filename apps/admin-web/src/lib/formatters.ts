import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Format currency in Iraqi Dinar (IQD)
 * Values are stored as integers (no decimals for IQD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with Arabic-Indic numerals
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-IQ').format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Format date in Arabic
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMMM yyyy', { locale: ar });
}

/**
 * Format date and time in Arabic
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMMM yyyy، HH:mm', { locale: ar });
}

/**
 * Format relative time in Arabic
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ar });
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Format phone number (Iraqi format)
 */
export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  // Iraqi format: 07XX XXX XXXX
  if (digits.length === 11 && digits.startsWith('07')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Order status labels in Arabic
 */
export const orderStatusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  PICKING: 'قيد التجهيز',
  READY: 'جاهز للتوصيل',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

/**
 * Order status colors
 */
export const orderStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PICKING: 'bg-blue-100 text-blue-800',
  READY: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

/**
 * Delivery status labels in Arabic
 */
export const deliveryStatusLabels: Record<string, string> = {
  ASSIGNED: 'تم التعيين',
  PICKED_UP: 'تم الاستلام',
  IN_TRANSIT: 'في الطريق',
  DELIVERED: 'تم التوصيل',
  FAILED: 'فشل التوصيل',
};

/**
 * User role labels in Arabic
 */
export const userRoleLabels: Record<string, string> = {
  ADMIN: 'مسؤول',
  MANAGER: 'مدير',
  PICKER: 'محضّر',
  DRIVER: 'سائق',
  CASHIER: 'كاشير',
};

/**
 * User role colors
 */
export const userRoleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-purple-100 text-purple-800',
  PICKER: 'bg-blue-100 text-blue-800',
  DRIVER: 'bg-green-100 text-green-800',
  CASHIER: 'bg-yellow-100 text-yellow-800',
};
