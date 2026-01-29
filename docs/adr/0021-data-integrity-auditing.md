# ADR 0021: Data Integrity, Constraints & Auditing

## Status

Accepted

## Context

The hypermarket platform needed enhanced data integrity protections and comprehensive audit logging for sensitive operations. This builds on the existing AuditLog infrastructure to provide complete traceability for compliance and operational oversight.

### Requirements

| Area | Requirement |
|------|-------------|
| Database Constraints | Prevent invalid data at database level |
| Audit Logging | Track sensitive operations for compliance |
| Traceability | Complete history of changes to critical data |

## Decision

We implemented database-level constraints and comprehensive audit hooks for sensitive operations:

### 1. Database CHECK Constraints

PostgreSQL CHECK constraints ensure data integrity at the database level:

```sql
-- Inventory: quantity must be non-negative
ALTER TABLE inventory_item
ADD CONSTRAINT chk_inventory_quantity_non_negative
CHECK (quantity >= 0);

-- Product: prices must be non-negative
ALTER TABLE product
ADD CONSTRAINT chk_product_cost_price_non_negative
CHECK (cost_price >= 0);

ALTER TABLE product
ADD CONSTRAINT chk_product_sale_price_non_negative
CHECK (sale_price >= 0);

-- OrderItem: quantity must be positive, price non-negative
ALTER TABLE order_item
ADD CONSTRAINT chk_order_item_quantity_positive
CHECK (quantity > 0);

ALTER TABLE order_item
ADD CONSTRAINT chk_order_item_unit_price_non_negative
CHECK (unit_price_iqd >= 0);

-- Order: total amount must be non-negative
ALTER TABLE "order"
ADD CONSTRAINT chk_order_total_amount_non_negative
CHECK (total_amount_iqd >= 0);

-- Payment: amount must be non-negative
ALTER TABLE payment
ADD CONSTRAINT chk_payment_amount_non_negative
CHECK (amount_iqd >= 0);

-- Refund: amount must be positive
ALTER TABLE refund
ADD CONSTRAINT chk_refund_amount_positive
CHECK (amount_iqd > 0);

-- DeliveryZone: fees and minimums must be non-negative
ALTER TABLE delivery_zone
ADD CONSTRAINT chk_delivery_zone_fee_non_negative
CHECK (fee_iqd >= 0);
```

**Constraint Summary:**

| Table | Constraint | Rule |
|-------|------------|------|
| inventory_item | quantity | >= 0 |
| product | cost_price, sale_price | >= 0 |
| order_item | quantity | > 0 |
| order_item | unit_price_iqd | >= 0 |
| order | total_amount_iqd | >= 0 |
| payment | amount_iqd | >= 0 |
| refund | amount_iqd | > 0 |
| delivery_zone | fee_iqd, min_order_iqd | >= 0 |

### 2. Audit Logging for Sensitive Operations

Comprehensive audit logging added to track all sensitive changes:

#### Product Changes (Price, Create, Delete)

```typescript
// Products Service - Price change audit
async update(id: string, dto: UpdateProductDto, userId?: string) {
  const existing = await this.findById(id);
  const product = await this.prisma.product.update({ ... });

  // Audit: Log price changes (PR#21)
  if (dto.price !== undefined && dto.price !== existing.price) {
    await this.auditService.log({
      userId: userId || 'system',
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      oldData: { price: existing.price, sku: existing.sku },
      newData: { price: dto.price, sku: product.sku },
    });
  }
  return product;
}
```

#### Order Status Changes

```typescript
// Orders Service - Status change audit
async updateStatus(id: string, dto: UpdateOrderStatusDto, userId?: string) {
  const order = await this.findById(id);
  const previousStatus = order.status;

  const updated = await this.prisma.order.update({ ... });

  // Audit: Log order status changes (PR#21)
  await this.auditService.log({
    userId: userId || 'system',
    action: 'STATUS_CHANGE',
    entity: 'Order',
    entityId: id,
    oldData: { status: previousStatus, orderNumber: order.orderNumber },
    newData: { status: dto.status },
  });
  return updated;
}
```

#### Settings Changes

```typescript
// Settings Service - Configuration change audit
async set(key: SettingKey, value: unknown, description?: string, userId?: string) {
  const oldValue = this.settingsCache.get(key) ?? SETTINGS_DEFAULTS[key];

  await this.prisma.setting.upsert({ ... });

  // Audit: Log setting changes (PR#21)
  await this.auditService.log({
    userId: userId || 'system',
    action: 'UPDATE',
    entity: 'Setting',
    entityId: key,
    oldData: { key, value: oldValue },
    newData: { key, value },
  });
}
```

#### Permission/Role Changes

```typescript
// Permissions Service - Role management audit
async createRole(data: {...}, userId?: string) {
  const role = await this.prisma.role.create({ ... });

  // Audit: Log role creation (PR#21)
  await this.auditService.log({
    userId: userId || 'system',
    action: 'CREATE',
    entity: 'Role',
    entityId: role.id,
    newData: { nameAr: role.nameAr, permissionCount: data.permissionIds.length },
  });
  return role;
}

async assignRoleToUser(userId: string, roleId: string, assignedByUserId?: string) {
  const assignment = await this.prisma.userCustomRole.create({ ... });

  // Audit: Log role assignment (PR#21)
  await this.auditService.log({
    userId: assignedByUserId || 'system',
    action: 'ASSIGNMENT',
    entity: 'UserCustomRole',
    entityId: assignment.id,
    newData: { targetUserId: userId, roleId, roleName: role.nameAr },
  });
  return assignment;
}
```

### 3. Audit Log Viewer (Pre-existing)

Admin audit log viewer already exists with:
- Filter by entity type, action, user, date range
- Pagination support
- Statistics endpoint for audit summaries

```
GET /api/v1/audit              - List with filters
GET /api/v1/audit/statistics   - Aggregate stats
GET /api/v1/audit/entity/:type/:id - Entity history
GET /api/v1/audit/user/:userId - User activity
```

## Consequences

### Positive

1. **Database-level integrity** - Invalid data cannot be inserted regardless of application bugs
2. **Complete audit trail** - All sensitive operations logged with before/after data
3. **Compliance ready** - Full traceability for regulatory requirements
4. **Debugging support** - Historical data helps investigate issues
5. **Non-blocking audit** - Audit logging failures don't break main operations

### Negative

1. **Storage growth** - Audit logs accumulate over time
2. **Slight latency** - Additional database writes for audit entries

### Audit Coverage Summary

| Entity | Actions Audited |
|--------|-----------------|
| Product | CREATE, UPDATE (price), DELETE |
| Order | STATUS_CHANGE, ASSIGNMENT, CANCEL |
| Setting | UPDATE |
| Role | CREATE, UPDATE, DELETE |
| UserCustomRole | ASSIGNMENT, DELETE |

## Files Changed

- `services/api/prisma/migrations/20250129_check_constraints.sql` - Database constraints
- `services/api/src/modules/products/products.service.ts` - Audit hooks
- `services/api/src/modules/orders/orders.service.ts` - Audit hooks
- `services/api/src/modules/settings/settings.service.ts` - Audit hooks
- `services/api/src/modules/permissions/permissions.service.ts` - Audit hooks

## Related

- ADR 0017: Reports & Analytics (initial AuditLog infrastructure)
- ADR 0018: Permission-Based Access Control
- ADR 0020: Security Hardening
- `services/api/src/modules/audit/` - Audit module
