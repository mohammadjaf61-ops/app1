# ADR 0028: Legal Compliance & Local Requirements for Iraq

## Status

Accepted

## Context

The platform is preparing for production launch in Iraq and must comply with:

1. **Legal requirements** - Terms of Service, Privacy Policy, Return Policy
2. **Consent tracking** - Record and verify customer consent before first order
3. **Local date formats** - Iraq uses Gregorian (primary) and Hijri (secondary) calendars
4. **Arabic-first** - All legal documents in Arabic

### Key Principles

| Requirement | Implementation |
|-------------|----------------|
| Legal documents | Arabic templates in markdown format |
| Consent tracking | Database model + API endpoints |
| No order without consent | Frontend blocks checkout without consent |
| Audit trail | IP, user agent, timestamp recorded |
| Date localization | ar-IQ locale with Hijri support |

## Decision

### 1. Legal Documents

Created three legal documents in Arabic under `docs/legal/`:

| Document | File | Purpose |
|----------|------|---------|
| Terms of Service | `TERMS_OF_SERVICE.md` | Service usage terms |
| Privacy Policy | `PRIVACY_POLICY.md` | Data collection and usage |
| Return/Refund Policy | `RETURN_REFUND_POLICY.md` | Return and refund terms |

Document structure:
- Version controlled (version 1.0)
- Effective date placeholder for launch
- Comprehensive sections covering legal requirements
- Arabic language throughout

### 2. User Consent Model

Added new Prisma model for consent tracking:

```prisma
enum ConsentDocumentType {
  TERMS_OF_SERVICE
  PRIVACY_POLICY
  RETURN_REFUND
}

model UserConsent {
  id            String              @id @default(uuid())
  customerPhone String              @map("customer_phone")
  documentType  ConsentDocumentType @map("document_type")
  version       String
  ipAddress     String?             @map("ip_address")
  userAgent     String?             @map("user_agent")
  acceptedAt    DateTime            @default(now()) @map("accepted_at")

  @@unique([customerPhone, documentType, version])
  @@map("user_consent")
}
```

Key features:
- Tracks consent by phone number (customers don't have accounts)
- Records document type and version accepted
- Stores IP and user agent for audit
- Unique constraint prevents duplicate consent records

### 3. Consent API

New consent module with endpoints:

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/consent/record` | POST | Record consent | Public |
| `/consent/check` | GET | Check consent status | Public |
| `/consent/versions` | GET | Get current document versions | Public |
| `/consent/stats` | GET | Admin consent statistics | Admin |

Consent service features:
- Records multiple document acceptances at once
- Checks if all required documents are accepted
- Current document versions tracked centrally
- Statistics for admin dashboard

### 4. Customer App Integration

New consent screen in customer mobile app:

```
app/
  consent.tsx        # Consent acceptance screen
  checkout.tsx       # Modified to check consent
```

Checkout flow:
1. User enters phone number
2. API checks consent status
3. If missing consent → redirect to consent screen
4. User accepts terms → recorded via API
5. Return to checkout with consent verified

UI Features:
- Three document cards with accept toggles
- "Accept All" button for convenience
- Required documents clearly marked
- Links to full document text
- Cannot proceed without required consents

### 5. Admin Dashboard

New compliance page (`/dashboard/compliance`):

Stats displayed:
- Total consents recorded
- Unique customers who consented
- Breakdown by document type
- Recent consents (last 7 days)

Features:
- Bar chart of consents by document type
- List of legal documents with versions
- Links to view full documents
- Info box explaining consent requirements

### 6. Local Date Formats

Added Iraq-specific date formatting to `@hypermarket/i18n`:

```typescript
// Primary: Gregorian calendar
formatDateIraq(date, 'medium')  // "29 يناير 2026"

// Secondary: Hijri calendar
formatDateHijri(date, 'medium') // "29 رجب 1447"

// Combined display
formatDateDual(date)            // "29 يناير 2026 م | 29 رجب 1447 هـ"

// Iraq timezone (AST = UTC+3)
getIraqDate()                   // Date in Asia/Baghdad timezone

// 12-hour time format (common in Iraq)
formatTimeIraq(date)            // "2:30 م"
```

Constants:
- `iraqDayNames` - Arabic day names
- `iraqMonthNames` - Gregorian months in Arabic
- `hijriMonthNames` - Hijri months in Arabic

## Implementation Files

### New Files

| File | Purpose |
|------|---------|
| `docs/legal/TERMS_OF_SERVICE.md` | Terms of service (Arabic) |
| `docs/legal/PRIVACY_POLICY.md` | Privacy policy (Arabic) |
| `docs/legal/RETURN_REFUND_POLICY.md` | Return/refund policy (Arabic) |
| `services/api/src/modules/consent/` | Consent module |
| `apps/customer-mobile/app/consent.tsx` | Consent screen |
| `apps/admin-web/src/app/dashboard/compliance/page.tsx` | Admin compliance page |

### Modified Files

| File | Changes |
|------|---------|
| `services/api/prisma/schema.prisma` | Added ConsentDocumentType enum and UserConsent model |
| `services/api/src/app.module.ts` | Added ConsentModule |
| `apps/customer-mobile/app/checkout.tsx` | Added consent check before order |
| `apps/customer-mobile/app/_layout.tsx` | Added consent screen route |
| `apps/admin-web/src/components/layout/dashboard-layout.tsx` | Added compliance nav item |
| `packages/i18n/src/utils.ts` | Added Iraq date formatting functions |
| `packages/i18n/src/index.ts` | Exported new date functions |
| `packages/i18n/src/locales/ar.json` | Added compliance translations |

## Consequences

### Positive

1. **Legal compliance** - Proper terms and consent tracking
2. **Audit trail** - Complete record of what was accepted, when, and by whom
3. **User control** - Clear consent process with document links
4. **Admin visibility** - Consent stats in dashboard
5. **Local feel** - Proper Arabic dates and Iraqi locale

### Negative

1. **Friction** - Extra step before first order
2. **Maintenance** - Documents need updates when policies change
3. **Version management** - Need process for document version updates

### Required Before Launch

1. **Legal review** - Have attorney review Arabic documents
2. **Version finalization** - Set effective dates
3. **Placeholders** - Replace `[example.com]` with actual URLs/phones

### Future Improvements

1. **Document hosting** - Move documents to CMS or dedicated pages
2. **Hijri accuracy** - Consider dedicated Hijri library for precise conversion
3. **Consent withdrawal** - Allow customers to withdraw consent
4. **Re-consent on update** - Trigger re-consent when document version changes

## Related

- ADR 0013: i18n Foundations
- ADR 0020: Security Hardening
- `docs/legal/` - Legal documents
- `services/api/src/modules/consent/` - Consent module
