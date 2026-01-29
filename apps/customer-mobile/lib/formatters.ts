/**
 * Format currency in Iraqi Dinar (IQD)
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
}

/**
 * Short format for inline display
 */
export function formatCurrencyShort(amount: number): string {
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  if (!phone) {
    return '';
  }
  // Format: 07XX XXX XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('07')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} - ${formatTime(date)}`;
}
