/**
 * String utilities
 */

/**
 * Generate URL-friendly slug from Arabic or English text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace Arabic characters with transliteration
    .replace(/[\u0621-\u064A]/g, (char) => {
      const arabicToLatin: Record<string, string> = {
        'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a',
        'ب': 'b', 'ت': 't', 'ث': 'th',
        'ج': 'j', 'ح': 'h', 'خ': 'kh',
        'د': 'd', 'ذ': 'th',
        'ر': 'r', 'ز': 'z',
        'س': 's', 'ش': 'sh',
        'ص': 's', 'ض': 'd',
        'ط': 't', 'ظ': 'z',
        'ع': 'a', 'غ': 'gh',
        'ف': 'f', 'ق': 'q',
        'ك': 'k', 'ل': 'l',
        'م': 'm', 'ن': 'n',
        'ه': 'h', 'و': 'w',
        'ي': 'y', 'ى': 'a',
        'ة': 'h', 'ئ': 'e',
      };
      return arabicToLatin[char] || char;
    })
    // Replace spaces and special chars with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate random order number
 * Format: HM-YYYYMMDD-XXXXX
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');

  const random = Math.random().toString(36).substring(2, 7).toUpperCase();

  return `HM-${dateStr}-${random}`;
}

/**
 * Generate random SKU
 * Format: CAT-RANDOM
 */
export function generateSKU(categoryPrefix: string): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${categoryPrefix.toUpperCase().slice(0, 3)}-${random}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Check if string contains Arabic characters
 */
export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Normalize Arabic text (remove diacritics)
 */
export function normalizeArabic(text: string): string {
  return text
    // Remove tashkeel (diacritics)
    .replace(/[\u064B-\u065F]/g, '')
    // Normalize alef variants
    .replace(/[أإآ]/g, 'ا')
    // Normalize taa marbuta
    .replace(/ة/g, 'ه')
    // Normalize yaa
    .replace(/ى/g, 'ي');
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('07')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}
