# ADR 0023: Staff Apps Completion (Picker & Driver Apps)

## Status

Accepted

## Context

The hypermarket platform required complete, production-ready mobile applications for store pickers and delivery drivers. These apps needed to be store-optimized for daily operations without relying on external integrations like maps or barcode scanners.

### Requirements

| Area | Requirement |
|------|-------------|
| Picker App | Order queue with priority sorting, clear picking path (aisle/shelf), item confirmation |
| Driver App | Delivery list, customer details, delivery proof |
| Backend | Full order state support for picker/driver workflows |
| Admin | Visibility into picker/driver assignments and status |
| Constraints | No maps, no barcode scanner, no external integrations |

## Decision

We verified and enhanced the existing staff apps to ensure production readiness:

### 1. Picker App (`apps/picker-app`)

**Order Queue:**
```typescript
// Orders sorted by priority with urgency indicators
function useAssignedOrders() {
  return useQuery({
    queryKey: queryKeys.assignedOrders,
    queryFn: async () => apiClient.getAssignedOrders(),
    refetchInterval: 30000, // Auto-refresh every 30s
  });
}
```

**Item Picking with Location:**
- Each item displays aisle and shelf location
- Clear visual indicators for picked/unavailable items
- Progress bar showing completion percentage

**Item Actions:**
- Pick item confirmation
- Mark item unavailable with reason (OUT_OF_STOCK, NOT_FOUND, DAMAGED, etc.)
- Notes for unavailable items

**Offline Support:**
- SQLite for local data persistence
- Sync when connection restored

### 2. Driver App (`apps/driver-app`)

**Delivery Queue:**
```typescript
// Deliveries separated by status
function useAssignedDeliveries() {
  return useQuery({
    queryKey: queryKeys.assignedDeliveries,
    queryFn: async () => apiClient.getAssignedDeliveries(),
    refetchInterval: 30000,
  });
}
```

**Customer Details:**
- Customer name and phone (with tap-to-call)
- Full delivery address
- Order notes/special instructions
- Payment method indicator (COD warning)

**Delivery Actions:**
- Confirm pickup from store
- Complete delivery with notes (delivery proof)
- Fail delivery with reason selection

**Failed Delivery Reasons:**
| Reason | Arabic Label |
|--------|--------------|
| CUSTOMER_UNAVAILABLE | العميل غير متوفر |
| WRONG_ADDRESS | عنوان خاطئ |
| CUSTOMER_REJECTED | رفض العميل |
| PAYMENT_ISSUE | مشكلة في الدفع |
| OTHER | سبب آخر |

### 3. Backend Endpoints

**Picker Endpoints:**
```
GET  /orders/picker/queue     - Get picker's assigned orders
PATCH /orders/:id/status      - Update order status (PICKING → READY)
PATCH /orders/:id/assign-picker - Assign picker to order
```

**Driver Endpoints:**
```
GET  /delivery/driver/queue   - Get driver's assigned deliveries
POST /delivery/assign/:orderId - Assign driver to delivery
PATCH /delivery/:id/pickup    - Confirm pickup from store
PATCH /delivery/:id/complete  - Complete delivery
PATCH /delivery/:id/fail      - Mark delivery as failed
```

### 4. Order Status Flow

```
PENDING → PICKING → READY → OUT_FOR_DELIVERY → DELIVERED
                                             → FAILED
```

### 5. Admin Visibility Enhancement

**Orders Page:**
- Added "Assigned Staff" column showing picker/driver name
- Picker assignment dropdown for PENDING orders
- Order details sheet shows picker and driver info with contact details

```typescript
// Admin orders table column
{
  id: 'assignedStaff',
  header: 'المُكلّف',
  cell: ({ row }) => {
    if (order.picker) {
      return <User /> + order.picker.fullName;
    }
    if (order.deliveryAssignment?.driver) {
      return <Truck /> + order.deliveryAssignment.driver.fullName;
    }
  }
}
```

## Implementation Files

### Existing Comprehensive Implementation

| File | Purpose |
|------|---------|
| `apps/picker-app/src/screens/OrdersListScreen.tsx` | Order queue with urgency badges |
| `apps/picker-app/src/screens/OrderDetailsScreen.tsx` | Full picking UI with item actions |
| `apps/picker-app/src/hooks/use-api.ts` | Picker API hooks with offline support |
| `apps/picker-app/src/stores/picking-store.ts` | Zustand store for picking state |
| `apps/driver-app/src/screens/DeliveriesListScreen.tsx` | Delivery queue by status |
| `apps/driver-app/src/screens/DeliveryDetailsScreen.tsx` | Full delivery UI with actions |
| `apps/driver-app/src/hooks/use-api.ts` | Driver API hooks with offline support |
| `apps/driver-app/src/stores/delivery-store.ts` | Zustand store for delivery state |

### New/Enhanced Files (PR#23)

| File | Changes |
|------|---------|
| `apps/admin-web/src/app/dashboard/orders/page.tsx` | Added picker/driver visibility, picker assignment |
| `apps/admin-web/src/hooks/use-api.ts` | Added useAssignPicker hook |

## Consequences

### Positive

1. **Full picker workflow** - Queue, item picking, unavailable marking, completion
2. **Full driver workflow** - Pickup confirmation, delivery completion, failure handling
3. **Admin visibility** - See who is working on each order
4. **Offline resilience** - Both apps work offline with SQLite
5. **No external dependencies** - No maps or barcode scanners required
6. **Arabic-first UI** - Full RTL support with Arabic labels

### Negative

1. **No GPS tracking** - Driver location not tracked (per requirements)
2. **Manual item identification** - No barcode scanning (per requirements)

### Store Operations Flow

| Step | Actor | Action | Status Change |
|------|-------|--------|---------------|
| 1 | Admin | Assign picker to order | PENDING → PICKING |
| 2 | Picker | Pick items, mark unavailable | (item status) |
| 3 | Picker | Complete picking | PICKING → READY |
| 4 | Admin | Assign driver | READY → OUT_FOR_DELIVERY |
| 5 | Driver | Confirm pickup | (delivery status) |
| 6 | Driver | Complete or fail delivery | → DELIVERED or FAILED |

## Related

- ADR 0022: Customer Experience Completion
- ADR 0021: Data Integrity, Constraints & Auditing
- `packages/shared-types/` - OrderStatus, DeliveryStatus enums
