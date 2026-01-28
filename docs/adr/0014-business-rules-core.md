# ADR 0014: Business Rules Core (Hypermarket Order Validation)

## Status
Accepted

## Date
2026-01-28

## Context
The hypermarket platform needed configurable business rules to:
- Enforce minimum order amounts per delivery zone
- Define delivery zones with configurable fees
- Set store operating hours per day of week
- Prevent orders too close to closing time (cutoff rules)
- Block order creation when rules are violated

Requirements:
- Simple, interpretable rules (no "smart" AI logic)
- Admin-configurable without code changes
- Clear error messages for customers
- i18n-ready error codes

Explicitly out of scope:
- Coupons and discount codes
- Loyalty programs
- Complex pricing tiers
- Major frontend redesigns

## Decision

### Database Models

Added two new Prisma models:

```prisma
model DeliveryZone {
  id               String   @id @default(uuid())
  nameAr           String   @map("name_ar")
  nameEn           String?  @map("name_en")
  feeIqd           Int      @map("fee_iqd")
  minOrderIqd      Int      @map("min_order_iqd")
  estimatedMinutes Int?     @map("estimated_minutes")
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@index([isActive], map: "idx_delivery_zone_active")
  @@map("delivery_zone")
}

enum DayOfWeek {
  SUNDAY
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
}

model StoreHours {
  id                 String    @id @default(uuid())
  dayOfWeek          DayOfWeek @unique @map("day_of_week")
  openAt             String    @map("open_at")      // HH:MM format
  closeAt            String    @map("close_at")     // HH:MM format
  isClosed           Boolean   @default(false) @map("is_closed")
  orderCutoffMinutes Int       @default(60) @map("order_cutoff_minutes")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  @@map("store_hours")
}
```

### Service Architecture

Created `BusinessRulesModule` as a global module with three services:

```
modules/business-rules/
├── business-rules.module.ts      # @Global() module
├── business-rules.service.ts     # Orchestrator
├── business-rules.controller.ts  # Public endpoints
├── business-rules-admin.controller.ts  # Admin CRUD
├── pricing-rules.service.ts      # Delivery zones & fees
├── store-availability.service.ts # Store hours & cutoff
└── dto/index.ts                  # Request/response DTOs
```

#### PricingRulesService
- `getActiveDeliveryZones()` - List zones for frontend selection
- `validateMinOrder(amount, zoneId)` - Check minimum order met
- `getDeliveryFee(zoneId)` - Get fee for zone
- `calculateOrderTotal(subtotal, zoneId)` - Full pricing calculation

#### StoreAvailabilityService
- `getAllStoreHours()` - Get weekly schedule
- `isStoreOpen(now)` - Simple open/closed check
- `canPlaceOrder(now)` - Full check including cutoff time
- `findNextOpenDay(from)` - When will store reopen

#### BusinessRulesService
- `validateOrder(request)` - Combined validation returning detailed result
- `validateOrderOrThrow(request)` - Throws BadRequestException if invalid

### Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend calls POST /business-rules/validate-order       │
│    { subtotalIqd: 25000, deliveryZoneId: "zone-uuid" }      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. StoreAvailabilityService.canPlaceOrder()                 │
│    - Is store open? (check hours for current day)           │
│    - Has order cutoff passed? (X minutes before close)      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PricingRulesService.validateMinOrder()                   │
│    - Is zone active?                                         │
│    - Is subtotal >= zone minimum?                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Return validation result                                  │
│    { canProceed: true/false, errors: [...], ... }           │
└─────────────────────────────────────────────────────────────┘
```

### Error Codes

All errors use i18n-ready codes instead of hardcoded Arabic:

| Code | Meaning |
|------|---------|
| `businessRules.storeClosed` | Store is currently closed |
| `businessRules.storeNotOpenYet` | Store hasn't opened yet today |
| `businessRules.orderCutoffPassed` | Too close to closing time |
| `businessRules.belowMinimumOrder` | Order below zone minimum |
| `errors.deliveryUnavailable` | Zone not found or inactive |

### Order Creation Integration

Updated `OrdersService.create()` to validate before creating:

```typescript
async create(dto: CreateOrderDto, userId: string) {
  // ... calculate subtotal from items ...

  // Validate business rules (throws if invalid)
  const { deliveryFeeIqd, totalAmountIqd } =
    await this.businessRules.validateOrderOrThrow({
      subtotalIqd: subtotal,
      deliveryZoneId: dto.deliveryZoneId,
    });

  // Proceed with order creation using validated amounts
  return this.prisma.order.create({
    data: {
      subtotalIqd: subtotal,
      deliveryFeeIqd,
      totalAmountIqd,
      deliveryZoneId: dto.deliveryZoneId,
      // ...
    },
  });
}
```

### Caching Strategy

Both services cache data with 5-minute TTL:
- `settings:delivery_zones` - Active zones
- `settings:store_hours` - Store hours

Cache invalidation called after admin updates:
```typescript
await this.cache.del(`${CACHE_KEYS.SETTINGS}:delivery_zones`);
await this.cache.del(`${CACHE_KEYS.SETTINGS}:store_hours`);
```

### Admin Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/admin/business-rules/delivery-zones` | List all zones | Any staff |
| POST | `/admin/business-rules/delivery-zones` | Create zone | Admin |
| PUT | `/admin/business-rules/delivery-zones/:id` | Update zone | Admin |
| DELETE | `/admin/business-rules/delivery-zones/:id` | Delete zone | Admin |
| GET | `/admin/business-rules/store-hours` | List all hours | Any staff |
| PUT | `/admin/business-rules/store-hours/:day` | Update day | Admin |
| POST | `/admin/business-rules/store-hours/init-defaults` | Init 7 days | Admin |

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/business-rules/delivery-zones` | Active zones for selection |
| GET | `/business-rules/store-hours` | Weekly schedule display |
| GET | `/business-rules/store-availability` | Current open/closed status |
| POST | `/business-rules/validate-order` | Pre-validate before checkout |

## Files Created/Modified

### New Module
- `services/api/src/modules/business-rules/` - Complete module

### Database
- `services/api/prisma/schema.prisma` - Added DeliveryZone, StoreHours, DayOfWeek

### Orders Module
- `services/api/src/modules/orders/orders.service.ts` - Integration
- `services/api/src/modules/orders/dto/create-order.dto.ts` - Added deliveryZoneId

### i18n
- `packages/i18n/src/locales/ar.json` - Added businessRules namespace
- `packages/i18n/src/locales/en.json` - Added businessRules namespace

## Alternatives Considered

### 1. Hardcoded Rules in Environment Variables
Rejected - not admin-configurable, requires redeployment.

### 2. JSON Configuration Files
Rejected - no audit trail, harder to manage via admin UI.

### 3. Complex Rule Engine (Drools-style)
Rejected - over-engineered for simple boolean rules.

### 4. Validation at Frontend Only
Rejected - backend must be source of truth for security.

## Consequences

### Positive
- Clear separation of business rule logic
- Admin can adjust rules without code changes
- Consistent validation at API and order creation
- i18n-ready error messages
- Caching reduces database load
- Easy to extend with new rules

### Negative
- Requires database migration for new rule types
- Cache TTL means rule changes take up to 5 minutes to propagate
- Frontend must handle validation errors gracefully

## Future Improvements

1. Add time-based delivery fees (rush hour pricing)
2. Add zone polygon/geofence support
3. Add special holiday hours
4. Add delivery time slot selection
5. Add real-time cache invalidation via pub/sub
