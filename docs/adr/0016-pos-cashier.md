# ADR 0016: POS / Cashier System

## Status
Accepted

## Date
2026-01-28

## Context
The hypermarket platform needs a Point of Sale (POS) system for in-store sales that:
- Replaces the existing legacy cashier system
- Provides a fast, keyboard-first interface for cashiers
- Supports barcode scanning and SKU lookup
- Processes sales instantly (< 3 seconds per transaction)
- Integrates with existing inventory and order systems
- Works with CASH payments only (instant PAID status)

Requirements:
- Single-screen design optimized for speed
- Barcode/SKU input with auto-focus
- Cart management with quantity adjustments
- Instant inventory deduction on sale
- Digital receipt display
- Keyboard shortcuts for common actions
- Session statistics for cashiers

Explicitly out of scope (deferred to future PRs):
- Receipt printer integration
- Cash drawer integration
- Barcode scanner hardware integration
- Returns/refunds processing
- Discounts/promotions
- Multiple payment methods (card, mixed)

## Decision

### Order Type Distinction

Added `OrderType` enum to distinguish delivery orders from in-store POS sales:

```prisma
enum OrderType {
  DELIVERY  // Online order for delivery
  POS       // In-store point of sale
}

enum OrderStatus {
  // ... existing statuses
  COMPLETED  // POS order completed (paid and handed over)
}

enum PaymentMethod {
  COD   // Cash on Delivery
  CARD  // Card payment (future)
  CASH  // In-store cash payment (POS)
}
```

### Schema Changes

Modified Order model to support POS:

```prisma
model Order {
  orderType           OrderType     @default(DELIVERY)
  customerName        String?       // Optional for walk-in POS customers
  customerPhone       String?       // Optional for POS
  deliveryAddressText String?       // Null for POS orders
  cashierId           String?       // Who processed the POS sale

  cashier User? @relation("OrderCashier", ...)
}
```

Key design decisions:
- Customer info optional for POS (walk-in customers)
- Delivery address null for POS orders
- Separate `cashierId` field for audit trail
- POS orders use COMPLETED status (not DELIVERED)

### POS Order Number Format

POS orders use a distinct numbering scheme:

```
POS-YYYYMMDD-XXXXX
```

Example: `POS-20260128-00042` (42nd POS order on 28 Jan 2026)

This distinguishes them from delivery orders (e.g., `ORD-ABC123`) and provides sequential daily numbering for easy reference.

### Backend Architecture

Created `PosModule` with dedicated endpoints:

```
services/api/src/modules/pos/
├── pos.module.ts
├── pos.service.ts
├── pos.controller.ts
├── dto/
│   └── index.ts
└── index.ts
```

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pos/products/lookup/:sku` | Look up product by SKU/barcode |
| POST | `/pos/orders` | Create POS order (atomic transaction) |
| GET | `/pos/orders/:orderNumber` | Get order for receipt reprint |
| GET | `/pos/stats` | Get cashier's session statistics |
| GET | `/pos/orders` | Get recent orders for cashier |

#### Atomic Transaction

The `createOrder` method performs all operations in a single Prisma transaction:

1. Validate all products exist and have sufficient stock
2. Create Order with status COMPLETED
3. Create Payment with status PAID immediately
4. Deduct inventory from locations (FIFO from highest stock)
5. Create audit log entry

```typescript
await this.prisma.$transaction(async (tx) => {
  // Create order
  const order = await tx.order.create({ ... });

  // Create payment as PAID immediately
  await tx.payment.create({
    data: {
      orderId: order.id,
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
      amountIqd: total,
      paidAt: new Date(),
      paidBy: cashierId,
    },
  });

  // Deduct inventory
  for (const deduction of inventoryDeductions) {
    await tx.inventoryItem.update({
      where: { id: deduction.inventoryItemId },
      data: { quantity: { decrement: deduction.quantity } },
    });
  }

  // Audit log
  await tx.auditLog.create({ ... });
});
```

### Inventory Deduction Strategy

Inventory is deducted using a "highest stock first" approach:
1. Get all inventory items for the product, sorted by quantity descending
2. Deduct from locations with most stock first
3. This naturally balances stock across locations

### Web Cashier App

Created new Next.js application:

```
apps/cashier-web/
├── src/
│   ├── app/
│   │   ├── page.tsx       # Main POS interface
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── providers.tsx  # React Query provider
│   ├── hooks/
│   │   └── use-cart.ts    # Cart state management
│   └── lib/
│       └── api.ts         # POS API client
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

#### UI Design

Three views in a single component:

1. **Login View**: Phone/password authentication
2. **Cart View**: Main POS interface
   - Barcode input (auto-focus)
   - Cart items list with quantity controls
   - Total display
   - Pay/Clear buttons
   - Keyboard shortcuts help
3. **Receipt View**: Post-sale confirmation
   - Order number
   - Items summary
   - Total
   - New Sale button

#### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Add product / Start new sale |
| F12 | Complete payment |
| Escape | Clear cart |
| F2 | Focus barcode input |

#### State Management

Cart state managed via custom hook (`use-cart.ts`):

```typescript
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    subtotal,
    itemCount,
    isEmpty,
  };
}
```

No external state library needed - React useState is sufficient for this contained UI.

### i18n Support

Added `pos` namespace to both locale files:

```json
{
  "pos": {
    "title": "نقطة البيع",
    "scanBarcode": "امسح الباركود أو أدخل رمز المنتج...",
    "saleComplete": "تم إتمام البيع",
    "shortcuts": {
      "title": "اختصارات لوحة المفاتيح:",
      "enter": "إضافة المنتج",
      "f12": "دفع",
      "escape": "مسح السلة"
    }
  }
}
```

## Consequences

### Positive
- Fast, dedicated POS experience separate from admin interface
- Keyboard-first design enables rapid transactions
- Atomic transactions prevent inventory inconsistencies
- Clear audit trail with cashier attribution
- Compatible with existing order/inventory infrastructure
- Works offline-ready (local state, single API call per sale)

### Negative
- Duplicate order flow logic (POS vs delivery)
- No hardware integration yet (printer, scanner, drawer)
- Basic UI without advanced features (search, categories)
- Session stats require database queries (could cache)

### Risks
- Performance under high load (mitigate: database indices, caching)
- Browser crashes could lose cart (mitigate: localStorage backup)
- Network issues during sale (mitigate: retry logic, offline mode)

## Future Considerations

1. **Hardware Integration**: Receipt printer, barcode scanner, cash drawer
2. **Offline Mode**: Queue sales locally when network unavailable
3. **Returns/Refunds**: Reverse POS transactions with inventory adjustment
4. **Discounts**: Per-item and cart-level discounts
5. **Reports**: Daily sales reports, shift closeout
6. **Multi-terminal**: Support multiple POS stations
7. **Product Search**: Search/browse products without barcode

## References
- PR #16: POS / Cashier System
- ADR 0015: Payments & Local Integrations
- ADR 0014: Business Rules Core
