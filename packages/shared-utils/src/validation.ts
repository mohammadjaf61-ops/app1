/**
 * Validation utilities
 */

/**
 * Validate Iraqi phone number
 * Iraqi mobile numbers start with 07 and are 11 digits
 * Format: 07XXXXXXXXX
 */
export function isValidIraqiPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^07[3-9]\d{8}$/.test(cleaned);
}

/**
 * Format Iraqi phone number
 * Input: 07701234567 or +9647701234567
 * Output: 07701234567
 */
export function formatIraqiPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  // Remove country code if present
  if (cleaned.startsWith('964')) {
    cleaned = '0' + cleaned.slice(3);
  }

  // Add leading zero if missing
  if (cleaned.startsWith('7') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

/**
 * Format phone for international display
 * Input: 07701234567
 * Output: +964 770 123 4567
 */
export function formatPhoneInternational(phone: string): string {
  const cleaned = formatIraqiPhone(phone);
  if (!isValidIraqiPhone(cleaned)) {
    return phone;
  }

  // Convert to international format
  const international = '+964 ' + cleaned.slice(1, 4) + ' ' + cleaned.slice(4, 7) + ' ' + cleaned.slice(7);
  return international;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one letter and one number
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Check password strength
 */
export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

/**
 * Validate SKU format
 * Format: XXX-XXXXX (letters/numbers, dash, letters/numbers)
 */
export function isValidSKU(sku: string): boolean {
  return /^[A-Z0-9]{2,6}-[A-Z0-9]{3,8}$/i.test(sku);
}

/**
 * Validate barcode (EAN-13 or UPC-A)
 */
export function isValidBarcode(barcode: string): boolean {
  const cleaned = barcode.replace(/\D/g, '');
  return cleaned.length === 12 || cleaned.length === 13;
}
