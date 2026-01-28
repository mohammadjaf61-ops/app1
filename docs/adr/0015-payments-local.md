# ADR 0015: Payments & Local Integrations (Iraq-Ready)

## Status
Accepted

## Date
2026-01-28

## Context
The hypermarket platform needs a payment system that:
- Supports Cash on Delivery (COD) as the primary payment method for Iraq
- Provides foundation for future card payment gateway integrations
- Tracks payment status throughout order lifecycle
- Allows admin/driver to manually mark payments as collected
- Does not store sensitive payment data

Requirements:
- COD works end-to-end immediately
- Card payments have placeholder infrastructure (not yet connected)
- Clear payment status visibility for customers and staff
- Audit trail for payment status changes
- i18n support for payment-related messages

Explicitly out of scope:
- Full accounting/reconciliation system
- Bank settlement integration
- Actual card payment provider integration (ZainCash, AsiaHawala, etc.)
- Storing sensitive card data (PCI compliance)

## Decision

### Database Models

Added Payment model and PaymentStatus enum:

```prisma
enum PaymentMethod {
  COD  // Cash on Delivery - primary for Iraq
  CARD // Card payment via gateway (future)
}

enum PaymentStatus {
  PENDING   // Awaiting payment
  PAID      // Payment confirmed/collected
  FAILED    // Payment failed
  REFUNDED  // Payment refunded
}

model Payment {
  id            String        @id @default(uuid())
  orderId       String        @unique @map("order_id")
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
  amountIqd     Int           @map("amount_iqd")
  providerRef   String?       @map("provider_ref")
  providerName  String?       @map("provider_name")
  paidAt        DateTime?     @map("paid_at")
  paidBy        String?       @map("paid_by")
  failureReason String?       @map("failure_reason")
  metadata      Json?         @default("{}")
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  order Order @relation(...)
  @@map("payment")
}
```

### Service Architecture

Created `PaymentsModule` as a global module:

```
modules/payments/
├── payments.module.ts              # @Global() module
├── payments.service.ts             # Core payment logic
├── payments.controller.ts          # Public endpoints
├── payments-admin.controller.ts    # Admin endpoints
├── payment-provider.interface.ts   # Adapter interface
├── providers/
│   └── placeholder.provider.ts     # Stub provider
├── dto/index.ts                    # DTOs
└── index.ts                        # Exports
```

#### PaymentsService

Core methods:
- `createPayment(params)` - Creates payment record (COD: PENDING, CARD: initiates with provider)
- `getById(paymentId)` - Get payment details
- `getByOrderId(orderId)` - Get payment by order
- `markPaid(paymentId, paidBy)` - Manual COD collection confirmation
- `markFailed(paymentId, reason, actorId)` - Mark payment as failed
- `findAll(filters)` - List payments with filters
- `getStatistics()` - Aggregate payment stats

#### Payment Provider Adapter

Interface for future payment gateway integrations:

```typescript
interface PaymentProviderAdapter {
  readonly name: string;
  initiatePayment(request): Promise<InitiatePaymentResponse>;
  verifyPayment(providerRef): Promise<VerifyPaymentResponse>;
  handleWebhook?(payload): Promise<WebhookResult>;
}
```

Placeholder provider throws `NotImplementedException` for card payments.

### Order Integration

Updated order creation flow:

```typescript
// In OrdersService.create()
const paymentMethod = dto.paymentMethod || PaymentMethod.COD;

const order = await this.prisma.order.create({...});

// Create payment record
const payment = await this.paymentsService.createPayment({
  orderId: order.id,
  method: paymentMethod,
  amountIqd: totalAmountIqd,
  customerPhone: dto.customerPhone,
});

return { ...order, payment };
```

Order details now include payment information:
```typescript
include: {
  payment: {
    select: { id, method, status, amountIqd, paidAt, paidBy, failureReason }
  }
}
```

### API Endpoints

#### Public Endpoints (`/payments/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/payments/order/:orderId` | Get payment status by order |
| GET | `/payments/methods` | List available payment methods |

#### Admin Endpoints (`/admin/payments/*`)

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/` | List all payments | Admin, Manager, Cashier |
| GET | `/stats` | Payment statistics | Admin, Manager |
| GET | `/:id` | Get payment details | Admin, Manager, Cashier |
| POST | `/:id/mark-paid` | Mark as paid | Admin, Manager, Cashier, Driver |
| POST | `/:id/mark-failed` | Mark as failed | Admin, Manager |

### COD Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Customer places order with paymentMethod: COD            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Order created → Payment created (status: PENDING)        │
│    Order is valid for preparation                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Order prepared → Assigned to driver → Delivered          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Driver collects cash → Calls POST /mark-paid             │
│    Payment status: PAID, paidAt: now, paidBy: driverId      │
│    Order isPaid: true (updated in transaction)              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Audit log created (PAYMENT_STATUS_CHANGE)                │
└─────────────────────────────────────────────────────────────┘
```

### Audit Trail

Payment status changes are logged:

```typescript
await this.prisma.auditLog.create({
  data: {
    actorUserId: paidBy,
    entityType: 'Payment',
    entityId: paymentId,
    action: 'PAYMENT_STATUS_CHANGE',
    metadata: {
      previousStatus: 'PENDING',
      newStatus: 'PAID',
      orderId,
    },
  },
});
```

### i18n Support

Added `payments` namespace with Arabic and English translations:
- Payment method names
- Payment status labels
- Action messages (mark paid, mark failed)
- Error messages

## Files Created/Modified

### New Module
- `services/api/src/modules/payments/` - Complete payments module

### Database
- `services/api/prisma/schema.prisma` - Added Payment model, PaymentStatus enum, updated PaymentMethod

### Orders Module
- `services/api/src/modules/orders/orders.service.ts` - Payment integration
- `services/api/src/modules/orders/dto/create-order.dto.ts` - Added paymentMethod field

### Shared Types
- `packages/shared-types/src/order/index.ts` - Added PaymentStatus, CARD method
- `packages/shared-types/src/financial/index.ts` - Added Payment interface

### i18n
- `packages/i18n/src/locales/ar.json` - Added payments namespace
- `packages/i18n/src/locales/en.json` - Added payments namespace

### App Module
- `services/api/src/app.module.ts` - Added PaymentsModule

## What's Supported Now

1. **Cash on Delivery (COD)**
   - Full end-to-end flow
   - Order creation with automatic payment record
   - Manual payment confirmation by driver/staff
   - Audit logging

2. **Payment Tracking**
   - Status visibility for customers (via order endpoint)
   - Admin dashboard statistics
   - List/filter payments

3. **Future-Ready Infrastructure**
   - PaymentProviderAdapter interface
   - Provider reference and metadata storage
   - Webhook handling stub

## What's Deferred

1. **Card Payment Gateways**
   - ZainCash integration
   - AsiaHawala integration
   - FastPay integration
   - Other Iraqi payment providers

2. **Advanced Features**
   - Partial refunds
   - Payment retries
   - Recurring payments
   - Split payments

3. **Accounting**
   - Bank reconciliation
   - Financial reporting
   - Settlement tracking

## Alternatives Considered

### 1. No Payment Model (Just Order.isPaid)
Rejected - insufficient tracking, no audit trail, can't support future gateways.

### 2. Full Payment Gateway Integration Now
Rejected - premature complexity, COD is primary method for Iraq market.

### 3. Third-Party Payment Service
Rejected - overkill for current requirements, adds dependency.

## Consequences

### Positive
- COD works immediately for Iraq market
- Clean architecture for adding payment providers
- Full audit trail for financial compliance
- Payment status visible to all stakeholders
- No sensitive data storage required

### Negative
- Card payments require additional work to enable
- No automated reconciliation yet
- Manual payment confirmation required for COD

## Adding a Payment Provider

1. Create provider class implementing `PaymentProviderAdapter`
2. Add provider credentials to configuration
3. Register provider in `PaymentsModule`
4. Update `createPayment` to select provider based on method
5. Add webhook endpoint if provider supports callbacks

Example for ZainCash:
```typescript
@Injectable()
export class ZainCashProvider implements PaymentProviderAdapter {
  readonly name = 'zaincash';

  async initiatePayment(request) {
    // Call ZainCash API
  }

  async verifyPayment(providerRef) {
    // Verify with ZainCash
  }

  async handleWebhook(payload) {
    // Process callback
  }
}
```
