# Go-Live Checklist - Hypermarket Platform

This checklist ensures all requirements are met before launching the Hypermarket Platform in production.

## Pre-Launch Timeline

| Timeframe | Phase |
|-----------|-------|
| T-14 days | Infrastructure setup |
| T-7 days | Security review |
| T-3 days | Final testing |
| T-1 day | Pre-launch verification |
| T-0 | Go-Live |
| T+1 day | Post-launch monitoring |

---

## 1. Infrastructure Checklist

### Server Setup

- [ ] Production server provisioned
- [ ] Server hardened (SSH keys, no root login, firewall)
- [ ] Server timezone set to Asia/Baghdad
- [ ] Adequate resources allocated:
  - [ ] CPU: Minimum 4 cores
  - [ ] RAM: Minimum 8 GB
  - [ ] Disk: Minimum 100 GB SSD

### Database (PostgreSQL)

- [ ] PostgreSQL 16+ installed and running
- [ ] Production database created
- [ ] Database user created with limited permissions
- [ ] Connection pooling configured (PgBouncer optional)
- [ ] Disk encryption enabled
- [ ] Backup automation configured
- [ ] Backup restoration tested

### Redis

- [ ] Redis 7+ installed and running
- [ ] Password authentication enabled
- [ ] AOF persistence enabled
- [ ] Memory limit configured
- [ ] Backup automation configured

### File Storage

- [ ] MinIO/S3 bucket created
- [ ] Public bucket for product images
- [ ] Backup automation configured
- [ ] CDN configured (optional)

---

## 2. Application Checklist

### API Backend

- [ ] Production build successful: `pnpm api:build`
- [ ] All tests passing: `pnpm api:test`
- [ ] Health endpoint working: `/api/health`
- [ ] All migrations applied: `pnpm db:migrate`
- [ ] Prisma client generated: `pnpm db:generate`

### Admin Web

- [ ] Production build successful: `pnpm admin:build`
- [ ] All pages loading correctly
- [ ] Arabic RTL layout correct
- [ ] Login/logout working

### Mobile Apps

- [ ] Customer app builds successfully
- [ ] Picker app builds successfully
- [ ] Driver app builds successfully
- [ ] App store submissions ready (if applicable)

---

## 3. Security Checklist

### Authentication

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] JWT_REFRESH_SECRET is strong (32+ characters)
- [ ] Secrets are unique per environment
- [ ] Token expiration configured appropriately
- [ ] Password hashing using bcrypt

### Network Security

- [ ] HTTPS enabled (SSL certificate installed)
- [ ] HTTP redirects to HTTPS
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] Security headers configured:
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-Frame-Options: DENY
  - [ ] X-XSS-Protection: 1; mode=block

### Data Security

- [ ] Database encrypted at rest
- [ ] Sensitive data not logged
- [ ] PII handling compliant
- [ ] Audit logging enabled

### Access Control

- [ ] Admin accounts created
- [ ] Default passwords changed
- [ ] Role permissions verified
- [ ] Multi-factor auth (optional but recommended)

---

## 4. Environment Configuration

### Production Environment Variables

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` configured (production DB)
- [ ] `REDIS_HOST` and `REDIS_PORT` configured
- [ ] `REDIS_PASSWORD` set
- [ ] `JWT_SECRET` set (unique, strong)
- [ ] `JWT_REFRESH_SECRET` set (unique, strong)
- [ ] `CORS_ORIGINS` set to production domains
- [ ] `PORT` configured

### Feature Flags

- [ ] Review all feature flags for production:
  ```
  feature_demand_forecasting: OFF (default)
  feature_basket_analysis: OFF (default)
  feature_anomaly_detection: ON
  feature_ai_insights: ON
  ```

### Admin Web Environment

- [ ] `NEXT_PUBLIC_API_URL` points to production API
- [ ] `NEXT_PUBLIC_APP_URL` set correctly

---

## 5. Data Preparation

### Seed Data

- [ ] Categories created
- [ ] Products imported
- [ ] Delivery zones configured
- [ ] Delivery time slots set
- [ ] Store settings configured:
  - [ ] Store name
  - [ ] Contact information
  - [ ] Working hours
  - [ ] Minimum order value
  - [ ] Delivery fees

### User Accounts

- [ ] Admin accounts created
- [ ] Manager accounts created
- [ ] Picker accounts created
- [ ] Driver accounts created
- [ ] Cashier accounts created (if POS used)

---

## 6. Testing Checklist

### Functional Testing

- [ ] Customer can browse products
- [ ] Customer can add to cart
- [ ] Customer can place order
- [ ] Admin can view order
- [ ] Admin can assign picker
- [ ] Picker can see assigned orders
- [ ] Picker can complete picking
- [ ] Admin can assign driver
- [ ] Driver can see assigned deliveries
- [ ] Driver can complete delivery
- [ ] Order status updates correctly throughout flow

### Edge Cases

- [ ] Empty cart handling
- [ ] Out of stock handling
- [ ] Invalid coupon handling
- [ ] Network error handling
- [ ] Session timeout handling

### Performance Testing

- [ ] API response time < 500ms (p95)
- [ ] Page load time < 3 seconds
- [ ] Concurrent user load tested (50+ users)
- [ ] Database query performance verified

### Mobile Testing

- [ ] Customer app on iOS
- [ ] Customer app on Android
- [ ] Picker app on target devices
- [ ] Driver app on target devices

---

## 7. Monitoring & Alerting

### Logging

- [ ] Structured logging enabled
- [ ] Log aggregation configured (e.g., ELK, CloudWatch)
- [ ] Log retention policy set (minimum 30 days)

### Health Checks

- [ ] API health endpoint monitored
- [ ] Database connection monitored
- [ ] Redis connection monitored

### Alerts (Optional but Recommended)

- [ ] API error rate alert
- [ ] Database connection alert
- [ ] Disk space alert
- [ ] CPU/Memory alert
- [ ] SSL certificate expiry alert

---

## 8. Backup & Recovery

### Backup Configuration

- [ ] Database backup scheduled (daily)
- [ ] Redis backup scheduled (weekly)
- [ ] File storage backup scheduled (daily)
- [ ] Backup retention configured (30 days minimum)

### Recovery Testing

- [ ] Database restore tested
- [ ] Redis restore tested
- [ ] File storage restore tested
- [ ] Recovery time documented

---

## 9. Documentation

### Technical Documentation

- [ ] SYSTEM_OVERVIEW.md reviewed and accurate
- [ ] DEPLOYMENT_GUIDE.md tested
- [ ] OPERATIONS_RUNBOOK.md available
- [ ] INCIDENT_RESPONSE.md available
- [ ] BACKUP_RECOVERY.md verified

### User Documentation

- [ ] ADMIN_GUIDE.md available for operators
- [ ] Staff training completed
- [ ] Contact information updated

### Developer Documentation

- [ ] DEV_ONBOARDING.md up to date
- [ ] ADRs complete for major decisions
- [ ] Code comments adequate

---

## 10. Communication & Support

### Stakeholder Communication

- [ ] Launch date communicated
- [ ] Downtime windows communicated (if any)
- [ ] Support contact information shared

### Support Readiness

- [ ] On-call rotation established
- [ ] Escalation matrix defined
- [ ] Support team trained

---

## Go-Live Day Checklist (T-0)

### Morning (Before Launch)

- [ ] Final health check passed
- [ ] Team on standby
- [ ] Rollback plan reviewed

### Launch

- [ ] DNS switched to production
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] First orders verified

### Post-Launch (T+1 hour)

- [ ] Error rate normal
- [ ] Performance normal
- [ ] Orders flowing correctly
- [ ] No critical issues

### End of Day

- [ ] Summary report created
- [ ] Issues documented
- [ ] Next day plan confirmed

---

## Post-Launch Checklist (T+1 Day)

### Monitoring Review

- [ ] Review overnight errors
- [ ] Check backup completion
- [ ] Verify all services running

### Operational Handover

- [ ] Operations team briefed
- [ ] Known issues documented
- [ ] Enhancement requests logged

### Retrospective

- [ ] What went well?
- [ ] What could be improved?
- [ ] Action items for next launch

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Project Lead | [Name] | [Phone/Email] |
| Tech Lead | [Name] | [Phone/Email] |
| DevOps | [Name] | [Phone/Email] |
| Database Admin | [Name] | [Phone/Email] |

---

## Rollback Plan

If critical issues occur:

1. **Immediate**: Assess severity (P1/P2/P3)
2. **T+15 min**: If P1 unresolved, initiate rollback
3. **Rollback steps**:
   - Switch DNS back to previous version
   - Restore database if data corrupted
   - Notify stakeholders
4. **Post-rollback**: Document issues, plan fixes

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Manager | | | |
| Tech Lead | | | |
| QA Lead | | | |
| Operations | | | |
| Security | | | |

---

**Go-Live Approved:** ☐ Yes ☐ No

**Date:** _______________

**Notes:**
