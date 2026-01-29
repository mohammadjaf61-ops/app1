/**
 * Log sanitization utilities
 * Prevents sensitive data from being logged
 * Security: PR#20
 */

/**
 * List of sensitive field names that should be redacted in logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'otp',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'authorization',
  'creditCard',
  'cardNumber',
  'cvv',
  'pin',
];

/**
 * Redacts sensitive fields from an object for safe logging
 * @param obj - Object to sanitize
 * @returns Sanitized object with sensitive fields redacted
 */
export function sanitizeForLog<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();

    // Check if field name contains sensitive keywords
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
      (sanitized as Record<string, unknown>)[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      (sanitized as Record<string, unknown>)[key] = sanitizeForLog(
        sanitized[key] as Record<string, unknown>,
      );
    }
  }

  return sanitized;
}

/**
 * Masks a phone number for logging (shows only last 4 digits)
 * @param phone - Phone number to mask
 * @returns Masked phone number
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) {
    return '****';
  }
  return `***${phone.slice(-4)}`;
}

/**
 * Masks an email for logging (shows first 2 chars and domain)
 * @param email - Email to mask
 * @returns Masked email
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '****@****';
  }
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Checks if a string looks like a JWT token
 * @param str - String to check
 * @returns True if string appears to be a JWT
 */
export function isJwtLike(str: string): boolean {
  if (typeof str !== 'string') return false;
  const parts = str.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 10);
}

/**
 * Masks a JWT token for logging (shows only first and last few chars)
 * @param token - JWT token to mask
 * @returns Masked token
 */
export function maskToken(token: string): string {
  if (!token || token.length < 20) {
    return '[TOKEN]';
  }
  return `${token.slice(0, 10)}...${token.slice(-5)}`;
}
