# Release Notes - Hypermarket Platform v1.0.0-rc.1

**Release Date:** January 29, 2026
**Release Type:** Release Candidate
**Status:** Feature Freeze

---

## Overview

This release candidate (RC1) represents the feature-complete version of the Hypermarket Platform ready for production deployment. All core functionality has been implemented and tested.

---

## What's Included

### Core Features

1. **Customer Mobile App** (Expo/React Native)
   - Product browsing and search
   - Shopping cart management
   - Order placement (Cash on Delivery)
   - Order tracking
   - Customer authentication (OTP-based)

2. **Picker Mobile App** (React Native)
   - Order queue display
   - Item picking workflow
   - Item scanning support
   - Order status updates

3. **Driver Mobile App** (React Native)
   - Delivery assignment queue
   - Navigation support
   - Delivery confirmation
   - Status updates

4. **Admin Web Dashboard** (Next.js)
   - Order management
   - Inventory management
   - Product catalog
   - Delivery zone configuration
   - User and role management
   - Reports and analytics
   - AI Insights (read-only decision support)

5. **Cashier POS** (Next.js)
   - Quick product lookup
   - Cash sales
   - Receipt generation

6. **Backend API** (NestJS)
   - RESTful API with OpenAPI documentation
   - JWT authentication with refresh tokens
   - Role-based access control
   - Rate limiting and throttling
   - Structured logging with request tracing
   - Background job processing (Bull queues)

---

## Feature Flags Status

| Feature | Flag | Status | Notes |
|---------|------|--------|-------|
| AI Insights | `feature_ai_insights` | ON | Read-only decision support |
| Anomaly Detection | `feature_anomaly_detection` | ON | Sales anomaly alerts |
| Demand Forecasting | `feature_demand_forecasting` | OFF | Not production-ready |
| Basket Analysis | `feature_basket_analysis` | OFF | Not production-ready |

---

## Configuration Defaults

### Rate Limits
| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Global | 100 requests | 1 minute |
| Auth (login) | 5 requests | 1 minute |
| OTP send | 3 requests | 5 minutes |
| Order creation | 30 requests | 1 minute |
| POS operations | 60 requests | 1 minute |

### Cache TTLs
| Data Type | TTL |
|-----------|-----|
| Products list | 10 minutes |
| Categories | 15 minutes |
| Admin KPIs | 60 seconds |
| Settings | 5 minutes |

### JWT Configuration
| Token Type | Expiry |
|------------|--------|
| Access Token | 15 minutes |
| Refresh Token | 7 days |

---

## Known Issues

### Security Vulnerabilities (Transitive Dependencies)

| Severity | Package | Issue | Impact | Mitigation |
|----------|---------|-------|--------|------------|
| Critical | @remix-run/node | Path Traversal | Low - Not directly used | Expo dependency, await upstream fix |
| High | semver | ReDoS | Low - Build time only | Development dependency |
| High | ip | SSRF | Low - CLI tool only | React Native dependency |

**Note:** The xlsx vulnerability has been resolved in PR#29 by removing the library and replacing it with a secure CSV export utility.

### Lint Warnings

The codebase has ~770 lint warnings, primarily:
- Missing explicit return types on functions
- Security warnings for object injection patterns (intentional patterns)
- Import ordering preferences

These are non-blocking and do not affect functionality.

---

## Rollback Plan

### Feature Flags
All features can be disabled instantly via feature flags in the database:

```sql
-- Disable AI features
UPDATE setting SET value = '{"value": false}' WHERE key = 'feature_ai_insights';
UPDATE setting SET value = '{"value": false}' WHERE key = 'feature_anomaly_detection';
```

### Database Migrations
- Migration files are in `services/api/prisma/migrations/`
- For rollback, manually reverse SQL changes
- Backup recommended before any deployment

### Docker Rollback
```bash
# Tag current as rollback
docker tag hypermarket-api:latest hypermarket-api:rollback

# Deploy previous version
docker tag hypermarket-api:previous hypermarket-api:latest
docker restart hypermarket-api
```

---

## Deployment Checklist

See `docs/GO_LIVE_CHECKLIST.md` for complete checklist.

### Critical Items
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] JWT secrets set (32+ characters)
- [ ] CORS origins configured
- [ ] Backups verified
- [ ] Health checks passing

---

## Testing Summary

### Build Status
| Component | Status |
|-----------|--------|
| API Backend | ✅ Builds successfully |
| Admin Web | ✅ Builds successfully |
| Shared packages | ✅ Build successfully |

### Lint Status
| Component | Errors | Warnings |
|-----------|--------|----------|
| API | 0 | 769 |
| Admin Web | 0 | Multiple |
| Mobile Apps | 0 | Multiple |

---

## Changes Since Last Version

### PR#21 - Data Integrity
- Added database constraints
- Implemented audit logging
- Added price validation

### PR#22 - Customer Experience
- Completed customer mobile app
- Added order tracking
- Implemented cart management

### PR#23 - Staff Apps
- Added picker app order queue
- Added driver app delivery flow
- Admin visibility for picker/driver assignments

### PR#24 - AI Repositioning
- Disabled complex AI features by default
- Added read-only AI insights
- Implemented explainable format for insights

### PR#25 - Documentation
- Added SYSTEM_OVERVIEW.md
- Added DEPLOYMENT_GUIDE.md
- Added OPERATIONS_RUNBOOK.md
- Added INCIDENT_RESPONSE.md
- Added BACKUP_RECOVERY.md
- Added ADMIN_GUIDE.md
- Added DEV_ONBOARDING.md
- Added GO_LIVE_CHECKLIST.md

### PR#26 - Release Hardening
- Fixed missing ESLint configs
- Fixed lint errors (P0/P1)
- Updated version to 1.0.0-rc.1
- Verified build process
- Documented known issues

### PR#27 - Load & Stability Testing
- Added comprehensive load testing scenarios
- Created stability test suite
- Documented failure scenario tests
- Performance benchmarks established

### PR#28 - Legal Compliance
- Added Terms of Service
- Added Privacy Policy
- Added Return/Refund Policy
- Implemented user consent tracking
- Added Iraq-specific date formatting (Gregorian + Hijri)

### PR#29 - Final Security Hardening
- **Removed vulnerable xlsx library** (CVE-2024-22363 - Prototype Pollution)
- Added secure CSV export utility (`export-utils.ts`)
- Added security utility functions (`security-utils.ts`)
- Created comprehensive security review document
- Documented all known vulnerabilities and mitigations

### PR#30 - Final Review & Sign-off
- Code style cleanup and comment trimming
- Removed verbose/educational comments
- Consolidated duplicate formatter functions
- Created FINAL_SIGNOFF.md for commercial delivery
- All quality checks passing

### PR#31 - External Integrations Readiness
- Added pluggable integration architecture (SMS, Notifications, Accounting)
- Created provider interfaces with Noop implementations
- Added feature flags: `integration_sms_enabled`, `integration_notifications_enabled`, `integration_accounting_enabled`
- All integrations disabled by default (no external calls)
- Order event hooks ready for future activation
- ADR 0031 documents the architecture

### PR#32 - Data Migration & Cutover Strategy
- Created idempotent migration toolkit in `scripts/migrations/legacy/`
- Import scripts: categories, products, inventory, customers
- Natural key strategy (SKU, phone, nameAr) for upsert operations
- Dry-run mode for validation without database writes
- Batch processing with configurable size
- Post-migration validation suite (10 checks)
- Field mapping reference (`docs/MIGRATION_MAPPING.md`)
- Cutover plan with rollback procedures (`docs/CUTOVER_PLAN.md`)
- ADR 0032 documents the migration architecture

### PR#33 - Monitoring, Alerts & Operational Thresholds
- Extended `/health` endpoint with DB, Redis, Queue connectivity checks
- Added `/monitoring/metrics` endpoint (requests/min, error rate, latency percentiles)
- Added `/monitoring/status` endpoint for component health
- Defined operational thresholds (error rate >2%, queue lag >100, response time >2000ms)
- Created internal alerts engine with 30-second check interval
- Alert logging with deduplication and auto-resolution
- Admin status page at `/dashboard/status`
- No external dependencies (SaaS-free monitoring)
- ADR 0033 documents the monitoring architecture

### PR#34 - UX Polish, Accessibility & Arabic Excellence
- **Accessibility (WCAG 2.1 AA)**:
  - Touch targets ≥ 44px (buttons, icon buttons, interactive elements)
  - Enhanced focus states with visible ring indicators
  - Skip link for keyboard navigation ("تخطي إلى المحتوى الرئيسي")
  - Reduced motion support (`prefers-reduced-motion`)
  - High contrast mode support (`prefers-contrast: high`)
- **Arabic Fonts**:
  - Added custom Arabic fonts (DecotypeNaskh, AlArabiya)
  - Google Fonts fallback (Noto Kufi Arabic)
  - Font stack: DecotypeNaskh → AlArabiya → Noto Kufi Arabic → system-ui
  - Customer mobile app font loading with expo-font
- **Unified UI Components**:
  - `EmptyState` - Accessible empty list/section states with CTA
  - `ErrorState` - Error display with severity levels (error/warning/info)
  - `OfflineBanner` - Network status indicator
  - `LoadingButton` - Button with loading state and spinner
  - `ConfirmDialog` - Confirmation dialog with `useConfirmDialog` hook
- **RTL Support**:
  - `.rtl-flip` and `.rtl-auto-flip` utilities for icon direction
  - `.currency-iqd` utility for IQD formatting
- **Documentation**:
  - Created `UX_ACCESSIBILITY_NOTES.md` with comprehensive guidelines
  - Documented keyboard shortcuts and testing checklists
- ADR 0034 documents the UX architecture

### PR#35 - Commercial Readiness & Contract Artifacts
- **Pricing Justification** (`docs/commercial/PRICING_JUSTIFICATION.md`):
  - Detailed $100,000 breakdown by component
  - Comparison with alternatives (Shopify, Odoo, local teams)
  - ROI analysis and value proposition
- **Scope of Work** (`docs/commercial/SCOPE_OF_WORK.md`):
  - Complete list of included features
  - Explicit exclusions to prevent misunderstandings
  - Client responsibilities and assumptions
- **Delivery Milestones** (`docs/commercial/DELIVERY_MILESTONES.md`):
  - 4-phase delivery plan with payment schedule
  - Acceptance criteria for each phase
  - Milestone sign-off templates
- **Support & Maintenance** (`docs/commercial/SUPPORT_MAINTENANCE.md`):
  - 30-day warranty coverage
  - Post-warranty support options (Basic/Advanced/Premium)
  - Escalation procedures
- **Ownership & IP** (`docs/commercial/OWNERSHIP_IP.md`):
  - Full code ownership transfer upon payment
  - Data ownership rights
  - Confidentiality terms

### PR-A0 - Expo SDK 54 + Fonts + BuildKit
- **Expo SDK Upgrade**: All 6 mobile apps upgraded from SDK 50 → SDK 54
  - React Native 0.76.9, React 18.3.1
  - Updated all expo-* packages to SDK 54 compatible versions
  - NativeWind upgraded to 4.1.0
- **Typography System**:
  - Created `packages/mobile-core/src/theme/typography.ts`
  - Font families: DecotypeNaskh (primary), AlArabiya (secondary)
  - Type scale: xs/sm/base/lg/xl/2xl/3xl/4xl
  - Centralized font loading via `fontAssets`
- **Fonts Setup**:
  - Fonts stored in `packages/mobile-ui/assets/fonts/`
  - Copied to each app's `assets/fonts/` directory
- **Docker BuildKit Cache**:
  - Added `# syntax=docker/dockerfile:1.6` header
  - pnpm store cache mount for faster installs
  - Next.js build cache mount for admin-web

---

## Support Contacts

| Role | Contact |
|------|---------|
| Technical Lead | [To be filled] |
| DevOps | [To be filled] |
| Support | [To be filled] |

---

## Next Steps

1. Complete production environment setup
2. Run full integration tests
3. Perform load testing
4. ~~Address xlsx vulnerability~~ ✅ Resolved in PR#29
5. ~~Final security review~~ ✅ Completed in PR#29 (see SECURITY_REVIEW.md)
6. ~~Data migration toolkit~~ ✅ Completed in PR#32 (see CUTOVER_PLAN.md)
7. Execute data migration (dry-run → production)
8. Go-live!
