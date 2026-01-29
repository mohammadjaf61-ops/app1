# Cutover Plan - Legacy to Hypermarket Platform

خطة الانتقال من النظام القديم إلى منصة الهايبرماركت

## Overview

| Item | Details |
|------|---------|
| **Target Date** | TBD (Coordinate with operations) |
| **Window** | Thursday 10 PM - Friday 6 AM (8 hours) |
| **Rollback Deadline** | Friday 4 AM (2 hours before end) |
| **Go/No-Go Decision** | Thursday 9 PM |

---

## Pre-Cutover Checklist (D-7 to D-1)

### Week Before (D-7)

- [ ] Complete all migration dry-runs successfully
- [ ] Verify backup procedures work
- [ ] Test rollback procedure in staging
- [ ] Confirm all staff trained on new system
- [ ] Prepare customer communication templates
- [ ] Verify monitoring dashboards ready

### Day Before (D-1)

- [ ] Final dry-run with production-like data
- [ ] Verify all team members available for cutover
- [ ] Prepare rollback scripts
- [ ] Test database backup restoration
- [ ] Notify customers of maintenance window
- [ ] Verify VPN access for remote team

---

## Cutover Timeline

### Phase 1: Preparation (10:00 PM - 10:30 PM)

| Time | Task | Owner | Duration |
|------|------|-------|----------|
| 10:00 | Go/No-Go call with stakeholders | PM | 15 min |
| 10:15 | Enable maintenance mode | DevOps | 5 min |
| 10:20 | Stop legacy system writes | DBA | 5 min |
| 10:25 | Create final legacy backup | DBA | 5 min |

```bash
# Enable maintenance mode
kubectl set env deployment/api MAINTENANCE_MODE=true

# Verify no active transactions
psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

### Phase 2: Data Export (10:30 PM - 11:00 PM)

| Time | Task | Owner | Duration |
|------|------|-------|----------|
| 10:30 | Export categories from legacy | Data | 5 min |
| 10:35 | Export products from legacy | Data | 10 min |
| 10:45 | Export inventory from legacy | Data | 10 min |
| 10:55 | Export customers from legacy | Data | 5 min |

```bash
# Export commands (run on legacy server)
./export-categories.sh > /data/export/categories.json
./export-products.sh > /data/export/products.json
./export-inventory.sh > /data/export/inventory.json
./export-customers.sh > /data/export/customers.json

# Verify exports
ls -la /data/export/
```

### Phase 3: Data Import (11:00 PM - 1:00 AM)

| Time | Task | Owner | Duration |
|------|------|-------|----------|
| 11:00 | Create platform database backup | DBA | 10 min |
| 11:10 | Import categories | Data | 10 min |
| 11:20 | Validate categories | QA | 10 min |
| 11:30 | Import products | Data | 30 min |
| 12:00 | Validate products | QA | 15 min |
| 12:15 | Import inventory | Data | 30 min |
| 12:45 | Validate inventory | QA | 15 min |
| 1:00 | Import customers | Data | 15 min |

```bash
cd scripts/migrations/legacy

# Import with verbose logging
npx ts-node import-categories.ts /data/export/categories.json --verbose
npx ts-node import-products.ts /data/export/products.json --verbose
npx ts-node import-inventory.ts /data/export/inventory.json --verbose
npx ts-node import-customers.ts /data/export/customers.json --verbose
```

### Phase 4: Validation (1:00 AM - 2:00 AM)

| Time | Task | Owner | Duration |
|------|------|-------|----------|
| 1:00 | Run automated validation | QA | 15 min |
| 1:15 | Manual spot checks | QA | 30 min |
| 1:45 | Verify counts match | Data | 15 min |

```bash
# Run validation suite
npx ts-node validate-migration.ts

# Expected output:
# ✓ Categories exist: PASS
# ✓ Products have valid categories: PASS
# ✓ Inventory has valid products: PASS
# ... (10 checks total)
```

**Validation Criteria:**
- [ ] Category count matches legacy ±0%
- [ ] Product count matches legacy ±0%
- [ ] Inventory total quantity within ±1%
- [ ] Customer count matches legacy ±0%
- [ ] No orphan records
- [ ] Sample 50 products manually verified

### Phase 5: System Activation (2:00 AM - 3:00 AM)

| Time | Task | Owner | Duration |
|------|------|-------|----------|
| 2:00 | Configure integrations | DevOps | 15 min |
| 2:15 | Enable platform APIs | DevOps | 5 min |
| 2:20 | Smoke test critical paths | QA | 30 min |
| 2:50 | Enable monitoring alerts | DevOps | 10 min |

```bash
# Disable maintenance mode
kubectl set env deployment/api MAINTENANCE_MODE=false

# Verify API health
curl -s https://api.hypermarket.iq/health | jq
```

**Smoke Tests:**
1. [ ] Login as admin
2. [ ] View product catalog
3. [ ] Check inventory levels
4. [ ] Create test order
5. [ ] Complete test checkout
6. [ ] Verify order appears in dashboard

### Phase 6: Monitoring (3:00 AM - 6:00 AM)

| Time | Task | Owner | Duration |
|------|------|-------|----------|
| 3:00 | Monitor error rates | DevOps | Continuous |
| 3:00 | Watch for customer issues | Support | Continuous |
| 4:00 | **Rollback deadline** | All | Decision |
| 6:00 | Cutover complete | PM | - |

---

## Rollback Procedure

### Trigger Conditions
Initiate rollback if ANY of these occur before 4:00 AM:

1. Data validation fails with >1% discrepancy
2. Critical API errors >5% of requests
3. Unable to complete checkout flow
4. Database corruption detected
5. Stakeholder decision

### Rollback Steps

```bash
# 1. Enable maintenance mode immediately
kubectl set env deployment/api MAINTENANCE_MODE=true

# 2. Stop all platform services
kubectl scale deployment/api --replicas=0
kubectl scale deployment/worker --replicas=0

# 3. Restore platform database to pre-import state
pg_restore -d hypermarket_production /backups/pre-import-backup.sql

# 4. Notify team
./notify-team.sh "ROLLBACK INITIATED - Reverting to legacy system"

# 5. Re-enable legacy system
ssh legacy-server "systemctl start legacy-api"

# 6. Update DNS (if changed)
# (coordinate with DNS team)

# 7. Verify legacy system operational
curl -s https://legacy.hypermarket.iq/health
```

### Post-Rollback Actions
1. Schedule incident review
2. Document failure cause
3. Plan remediation
4. Reschedule cutover

---

## Communication Plan

### Internal Notifications

| When | Who | Message |
|------|-----|---------|
| D-7 | All staff | Cutover scheduled for [date] |
| D-1 | All staff | Reminder: Cutover tomorrow |
| 10:00 PM | Tech team | Cutover starting |
| 2:00 AM | Tech team | System going live |
| 6:00 AM | All staff | Cutover complete |

### Customer Notifications

| When | Channel | Message |
|------|---------|---------|
| D-3 | SMS | نعتذر عن أي انقطاع يوم الخميس 10م-6ص |
| D-1 | App Push | تذكير: صيانة مجدولة الليلة |
| 2:00 AM | App Banner | جاري التحديث - نعود قريباً |
| 6:00 AM | SMS | تم التحديث بنجاح! |

---

## Emergency Contacts

| Role | Name | Phone | Backup |
|------|------|-------|--------|
| Project Manager | TBD | +964-XXX | TBD |
| DBA Lead | TBD | +964-XXX | TBD |
| DevOps Lead | TBD | +964-XXX | TBD |
| QA Lead | TBD | +964-XXX | TBD |
| Business Sponsor | TBD | +964-XXX | TBD |

---

## Post-Cutover Tasks (D+1 to D+7)

### Day After (D+1)
- [ ] Monitor error rates closely
- [ ] Address any data discrepancies
- [ ] Collect user feedback
- [ ] Document any issues

### First Week (D+1 to D+7)
- [ ] Daily standup on system health
- [ ] Fix any migration-related bugs
- [ ] Decommission legacy system access (D+7)
- [ ] Conduct cutover retrospective

---

## Appendix: Verification Queries

```sql
-- Category count
SELECT COUNT(*) as platform_categories FROM "Category";

-- Product count
SELECT COUNT(*) as platform_products FROM "Product";

-- Inventory total
SELECT SUM(quantity) as total_inventory FROM "InventoryBalance";

-- Customer count
SELECT COUNT(*) as platform_customers FROM "User" WHERE role = 'CUSTOMER';

-- Products without category
SELECT COUNT(*) as orphan_products
FROM "Product"
WHERE "categoryId" IS NULL;

-- Inventory without product
SELECT COUNT(*) as orphan_inventory
FROM "InventoryBalance" ib
LEFT JOIN "Product" p ON ib."productId" = p.id
WHERE p.id IS NULL;
```

---

## See Also

- `docs/MIGRATION_MAPPING.md` - Field mapping reference
- `scripts/migrations/legacy/README.md` - Import scripts
- `docs/adr/0032-data-migration.md` - Architecture decision
