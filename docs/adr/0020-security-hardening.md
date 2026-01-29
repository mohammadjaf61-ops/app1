# ADR 0020: Security Hardening (OWASP-Driven)

## Status

Accepted

## Context

The hypermarket platform needed practical security hardening aligned with OWASP Top 10 guidelines. The goal was to implement production-ready security without over-engineering or disrupting user experience.

### Security Requirements

| Area | Requirement |
|------|-------------|
| Input Validation | Protect against injection attacks |
| Rate Limiting | Prevent brute-force and DoS attacks |
| Auth Hardening | Secure authentication flow |
| Security Headers | Protect against common web vulnerabilities |
| Logging | Prevent sensitive data leakage |

## Decision

We implemented targeted security enhancements focusing on practical protection:

### 1. Rate Limiting (Brute-Force Prevention)

Custom throttling decorators for different endpoint types:

```typescript
// Auth endpoints: 5 requests per minute
@ThrottleAuth()
@Post('login')
async login() { }

// OTP send: 3 requests per 5 minutes (prevents SMS bombing)
@ThrottleOtp()
@Post('otp/send')
async sendOtp() { }

// Order creation: 30 per minute
@ThrottleOrderCreate()
@Post()
async create() { }

// POS operations: 60 per minute
@ThrottlePOS()
@Controller('pos')
export class PosController { }
```

**Rate Limit Summary:**

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Login / OTP Verify | 5 | 1 minute |
| OTP Send | 3 | 5 minutes |
| Order Create | 30 | 1 minute |
| POS Operations | 60 | 1 minute |
| General API | 100 | 1 minute |

### 2. Security Headers (Helmet Configuration)

Enhanced Helmet configuration with environment-aware settings:

```typescript
helmet({
  // CSP - production only (disabled in dev for Swagger)
  contentSecurityPolicy: nodeEnv === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    }
  } : false,

  // Clickjacking protection
  frameguard: { action: 'deny' },

  // MIME sniffing protection
  noSniff: true,

  // Hide technology stack
  hidePoweredBy: true,

  // HSTS - production only
  hsts: nodeEnv === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,

  // Referrer policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
```

### 3. CORS Hardening

Strict CORS configuration:

```typescript
app.enableCors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : nodeEnv !== 'production',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  maxAge: 86400, // 24 hours preflight cache
});
```

### 4. Log Sanitization

Prevent sensitive data from appearing in logs:

```typescript
// Before (INSECURE)
this.logger.log(`Sending OTP ${MOCK_OTP} to ${dto.phone}`);

// After (SECURE - PR#20)
this.logger.log(`Sending OTP to phone ending in ...${dto.phone.slice(-4)}`);
```

Log sanitization utilities:
- `sanitizeForLog()` - Redacts sensitive fields (password, token, otp, etc.)
- `maskPhone()` - Shows only last 4 digits
- `maskEmail()` - Shows first 2 chars + domain
- `maskToken()` - Shows first 10 + last 5 chars

### 5. Input Validation (Already Implemented)

Global ValidationPipe configuration (pre-existing):

```typescript
new ValidationPipe({
  whitelist: true,           // Strip unknown properties
  forbidNonWhitelisted: true, // Reject requests with unknown props
  transform: true,            // Auto-transform payloads
});
```

### 6. Environment Validation (Already Implemented)

Joi schema requires critical secrets:

```typescript
validationSchema = Joi.object({
  JWT_SECRET: Joi.string().required().min(32),
  JWT_REFRESH_SECRET: Joi.string().required().min(32),
  DATABASE_URL: Joi.string().required(),
});
```

## Consequences

### Positive

1. **Brute-force protection** - Login/OTP attempts are rate-limited
2. **DoS mitigation** - API rate limits prevent resource exhaustion
3. **XSS/Clickjacking protection** - Security headers block common attacks
4. **Data leakage prevention** - Sensitive data never logged
5. **No user impact** - Normal usage stays unaffected

### Negative

1. **Legitimate users may hit limits** - During high activity periods
2. **Development friction** - Stricter CORS in production

### Deferred (Future Enhancements)

The following are intentionally deferred as they require infrastructure changes:

| Item | Reason |
|------|--------|
| WAF (Web Application Firewall) | Infrastructure-level, needs cloud setup |
| IDS (Intrusion Detection) | Requires monitoring infrastructure |
| IP Blacklisting | Needs Redis persistence layer |
| 2FA | Product decision required |
| Audit Logging | Already implemented in PR#17 |

## Security Checklist

| Check | Status |
|-------|--------|
| Rate limiting on auth endpoints | Implemented |
| Rate limiting on sensitive endpoints | Implemented |
| Security headers (Helmet) | Enhanced |
| CORS properly configured | Hardened |
| No secrets in repository | Verified |
| Env validation at startup | Pre-existing |
| OTP/tokens not logged | Fixed |
| Passwords not logged | Verified |
| Input validation on all endpoints | Pre-existing |
| JWT expiration configured | Pre-existing (24h) |

## Files Changed

- `services/api/src/main.ts` - Enhanced Helmet and CORS
- `services/api/src/modules/auth/auth.controller.ts` - Rate limiting
- `services/api/src/modules/auth/auth.service.ts` - Log sanitization
- `services/api/src/modules/orders/orders.controller.ts` - Rate limiting
- `services/api/src/modules/pos/pos.controller.ts` - Rate limiting
- `services/api/src/common/decorators/throttle.decorator.ts` - New
- `services/api/src/common/guards/throttler-behind-proxy.guard.ts` - New
- `services/api/src/common/security/log-sanitizer.ts` - New

## Related

- ADR 0018: Permission-Based Access Control
- OWASP Top 10 2021
- `services/api/src/common/security/` - Security utilities
