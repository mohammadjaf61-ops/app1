/**
 * Security Utilities
 *
 * This module provides security-related utilities for the admin dashboard.
 * It includes input validation, sanitization, and security checks.
 *
 * @module security-utils
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeHTML(input: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Validate that a string doesn't contain potential SQL injection patterns
 * Note: This is a client-side check only - server-side validation is essential
 */
export function containsSQLInjectionPatterns(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
    /(\b(UNION|JOIN)\b.*\b(SELECT)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /('|\"|`)\s*(OR|AND)\s*('|\"|`)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate URL to prevent open redirect attacks
 * Only allows relative URLs or URLs to allowed domains
 */
export function isValidRedirectURL(
  url: string,
  allowedDomains: string[] = []
): boolean {
  // Allow relative URLs
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname.toLowerCase();

    // Check against allowed domains
    return allowedDomains.some((domain) => {
      const normalizedDomain = domain.toLowerCase();
      return (
        hostname === normalizedDomain ||
        hostname.endsWith(`.${normalizedDomain}`)
      );
    });
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Validate file upload by checking extension and MIME type
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const MAX_FILE_SIZE_MB = 5;

export function validateImageFile(file: File): FileValidationResult {
  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE_MB} ميجابايت)`,
    };
  }

  // Check extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext)
  );
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'نوع الملف غير مسموح. الأنواع المسموحة: JPG, PNG, GIF, WebP',
    };
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    return {
      valid: false,
      error: 'نوع الملف غير صالح',
    };
  }

  return { valid: true };
}

/**
 * Generate a secure random string for CSRF tokens or nonces
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}

/**
 * Validate password strength
 */
export interface PasswordStrengthResult {
  valid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export function validatePasswordStrength(
  password: string
): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
  }

  if (password.length >= 12) {
    score++;
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }

  if (/[a-z]/.test(password)) {
    // No score increase, but no feedback either - considered baseline
  } else {
    feedback.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('يجب أن تحتوي على رقم واحد على الأقل');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('يُفضل إضافة رموز خاصة (!@#$%^&*)');
  }

  // Cap score at 4
  score = Math.min(score, 4);

  return {
    valid: score >= 2 && password.length >= 8,
    score,
    feedback,
  };
}

/**
 * Rate limiting helper for client-side actions
 * Returns true if action should be blocked
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function isRateLimited(
  action: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(action);

  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(action, { count: 1, resetTime: now + windowMs });
    return false;
  }

  existing.count++;
  if (existing.count > maxAttempts) {
    return true;
  }

  return false;
}

/**
 * Clear rate limit for an action
 */
export function clearRateLimit(action: string): void {
  rateLimitMap.delete(action);
}

/**
 * Mask sensitive data for display (e.g., phone numbers, emails)
 */
export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  const visibleDigits = 4;
  return '*'.repeat(phone.length - visibleDigits) + phone.slice(-visibleDigits);
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  const visibleChars = Math.min(2, localPart.length);
  const maskedLocal =
    localPart.slice(0, visibleChars) +
    '*'.repeat(Math.max(0, localPart.length - visibleChars));

  return `${maskedLocal}@${domain}`;
}

/**
 * Check if running in a secure context (HTTPS)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true; // SSR
  return window.isSecureContext || window.location.protocol === 'https:';
}

/**
 * Security headers check - reports missing recommended headers
 */
export interface SecurityHeadersReport {
  missing: string[];
  present: string[];
}

export async function checkSecurityHeaders(
  url?: string
): Promise<SecurityHeadersReport> {
  const recommendedHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'content-security-policy',
  ];

  const present: string[] = [];
  const missing: string[] = [];

  try {
    const response = await fetch(url || window.location.href, {
      method: 'HEAD',
    });
    const headers = response.headers;

    recommendedHeaders.forEach((header) => {
      if (headers.has(header)) {
        present.push(header);
      } else {
        missing.push(header);
      }
    });
  } catch {
    // If fetch fails, report all as unknown
    missing.push(...recommendedHeaders);
  }

  return { present, missing };
}
