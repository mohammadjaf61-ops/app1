// Format IQD currency
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
}

// Short currency format
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}م د.ع`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}ألف د.ع`;
  }
  return `${amount} د.ع`;
}

// Format date in Arabic
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format time
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format date and time
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} - ${formatTime(date)}`;
}

// Format time elapsed since order
export function formatTimeElapsed(date: string | Date): string {
  const now = new Date();
  const orderDate = new Date(date);
  const diffMs = now.getTime() - orderDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `منذ ${diffDays} يوم`;
  }
  if (diffHours > 0) {
    return `منذ ${diffHours} ساعة`;
  }
  if (diffMins > 0) {
    return `منذ ${diffMins} دقيقة`;
  }
  return 'الآن';
}

// Get urgency level based on time elapsed
export function getUrgencyLevel(date: string | Date): 'normal' | 'warning' | 'urgent' {
  const now = new Date();
  const orderDate = new Date(date);
  const diffMs = now.getTime() - orderDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins > 60) return 'urgent'; // More than 1 hour
  if (diffMins > 30) return 'warning'; // More than 30 mins
  return 'normal';
}

// Order status labels in Arabic
export const orderStatusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  PICKING: 'جاري التجهيز',
  READY: 'جاهز',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

// Order status colors
export const orderStatusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#d97706' },
  PICKING: { bg: '#dbeafe', text: '#2563eb' },
  READY: { bg: '#d1fae5', text: '#059669' },
  OUT_FOR_DELIVERY: { bg: '#e0e7ff', text: '#4f46e5' },
  DELIVERED: { bg: '#dcfce7', text: '#16a34a' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
};

// Format phone number
export function formatPhone(phone: string): string {
  if (!phone) return '';
  // Format Iraqi phone: 07XX XXX XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// Format location (aisle/shelf)
export function formatLocation(aisle?: string, shelf?: string): string {
  if (!aisle && !shelf) return 'غير محدد';
  if (aisle && shelf) return `${aisle} / ${shelf}`;
  return aisle || shelf || 'غير محدد';
}
