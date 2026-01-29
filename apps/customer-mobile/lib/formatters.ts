export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
}

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

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} - ${formatTime(date)}`;
}

// Alias for backward compatibility
export const formatCurrencyShort = formatCurrency;
