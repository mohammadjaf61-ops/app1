const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export function sanitizeHTML(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

export function containsSQLInjectionPatterns(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
    /(\b(UNION|JOIN)\b.*\b(SELECT)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(['"`])\s*(OR|AND)\s*(['"`])/i,
  ];
  return patterns.some((p) => p.test(input));
}

export function isValidRedirectURL(url: string, allowedDomains: string[] = []): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return allowedDomains.some((domain) => {
      const d = domain.toLowerCase();
      return hostname === d || hostname.endsWith(`.${d}`);
    });
  } catch {
    return false;
  }
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;

export function validateImageFile(file: File): FileValidationResult {
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_SIZE_MB) {
    return { valid: false, error: `حجم الملف يتجاوز الحد المسموح (${MAX_SIZE_MB} ميجابايت)` };
  }

  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return { valid: false, error: 'نوع الملف غير مسموح. الأنواع المسموحة: JPG, PNG, GIF, WebP' };
  }

  if (!ALLOWED_MIMES.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير صالح' };
  }

  return { valid: true };
}

export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface PasswordStrengthResult {
  valid: boolean;
  score: number;
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
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

  if (!/[a-z]/.test(password)) {
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

  return {
    valid: score >= 2 && password.length >= 8,
    score: Math.min(score, 4),
    feedback,
  };
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(action: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(action);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(action, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxAttempts;
}

export function clearRateLimit(action: string): void {
  rateLimitStore.delete(action);
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) {
    return phone;
  }
  return `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) {
    return email;
  }
  const visible = Math.min(2, local.length);
  return `${local.slice(0, visible)}${'*'.repeat(Math.max(0, local.length - visible))}@${domain}`;
}

export function isSecureContext(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  return window.isSecureContext || window.location.protocol === 'https:';
}

export interface SecurityHeadersReport {
  missing: string[];
  present: string[];
}

export async function checkSecurityHeaders(url?: string): Promise<SecurityHeadersReport> {
  const required = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'content-security-policy',
  ];

  const present: string[] = [];
  const missing: string[] = [];

  try {
    const res = await fetch(url || window.location.href, { method: 'HEAD' });
    required.forEach((h) => {
      if (res.headers.has(h)) {
        present.push(h);
      } else {
        missing.push(h);
      }
    });
  } catch {
    missing.push(...required);
  }

  return { present, missing };
}
