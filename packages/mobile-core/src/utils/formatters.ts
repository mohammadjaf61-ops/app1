/**
 * Format IQD currency
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
}

/**
 * Short currency format with abbreviations
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}م د.ع`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}ألف د.ع`;
  }
  return `${amount} د.ع`;
}

/**
 * Format IQD with Intl.NumberFormat
 */
export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with Arabic locale
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-IQ').format(num);
}

/**
 * Format date in Arabic
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} - ${formatTime(date)}`;
}

/**
 * Format relative time (time elapsed)
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'الآن';
  }
  if (diffMins < 60) {
    return `منذ ${diffMins} دقيقة`;
  }
  if (diffHours < 24) {
    return `منذ ${diffHours} ساعة`;
  }
  if (diffDays < 7) {
    return `منذ ${diffDays} يوم`;
  }
  return formatDate(targetDate);
}

/**
 * Format phone number (Iraqi format: 07XX XXX XXXX)
 */
export function formatPhone(phone: string): string {
  if (!phone) {
    return '';
  }
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('07')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Get urgency level based on time elapsed
 */
export function getUrgencyLevel(date: string | Date): 'normal' | 'warning' | 'urgent' {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins > 60) {
    return 'urgent';
  }
  if (diffMins > 30) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Format delivery window
 */
export function formatDeliveryWindow(readyAt?: string): string {
  if (!readyAt) {
    return 'في أقرب وقت';
  }

  const ready = new Date(readyAt);
  const now = new Date();
  const diffMins = Math.floor((ready.getTime() - now.getTime()) / 60000);

  if (diffMins < 0) {
    return 'جاهز الآن';
  }
  if (diffMins < 60) {
    return `خلال ${diffMins} دقيقة`;
  }
  return formatTime(readyAt);
}

/**
 * Format location (aisle/shelf)
 */
export function formatLocation(aisle?: string, shelf?: string): string {
  if (!aisle && !shelf) {
    return 'غير محدد';
  }
  if (aisle && shelf) {
    return `${aisle} / ${shelf}`;
  }
  return aisle || shelf || 'غير محدد';
}

/**
 * Order status labels in Arabic
 */
export const orderStatusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  PICKING: 'جاري التجهيز',
  READY: 'جاهز للتوصيل',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التوصيل',
  FAILED: 'فشل التوصيل',
  CANCELLED: 'ملغي',
};

/**
 * Order status colors for styling
 */
export const orderStatusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#d97706' },
  PICKING: { bg: '#dbeafe', text: '#2563eb' },
  READY: { bg: '#d1fae5', text: '#059669' },
  OUT_FOR_DELIVERY: { bg: '#e0e7ff', text: '#4f46e5' },
  DELIVERED: { bg: '#dcfce7', text: '#16a34a' },
  FAILED: { bg: '#fee2e2', text: '#dc2626' },
  CANCELLED: { bg: '#f3f4f6', text: '#6b7280' },
};

/**
 * Payment method labels
 */
export const paymentMethodLabels: Record<string, string> = {
  COD: 'الدفع عند الاستلام',
  PAID: 'مدفوع مسبقاً',
};

/**
 * Alias for formatRelativeTime (backward compatibility)
 */
export const formatTimeElapsed = formatRelativeTime;
