# ADR-0005: Inventory Reservation System

## Status
Accepted

## Date
2025-01-28

## Context
The existing order creation flow does not verify inventory availability before creating orders. This leads to potential overselling where:
- Multiple concurrent orders can claim the same inventory
- Orders may be created for products that are out of stock
- Price changes during checkout are not detected

For a hypermarket system handling high traffic, this can cause operational issues and poor customer experience.

## Decision
Implement an inventory reservation system with the following characteristics:

### 1. Reservation Model
Add `InventoryReservation` table to track reserved inventory:
- `id`: UUID primary key
- `productId`: Product being reserved
- `orderId`: Order holding the reservation
- `quantity`: Amount reserved
- `status`: HELD | COMMITTED | RELEASED
- `expiresAt`: TTL for automatic release (15 minutes)

### 2. Transaction-Based Order Creation
Wrap order creation in a Prisma transaction with `Serializable` isolation level:
1. Fetch products (validates existence and active status)
2. Validate expected prices (optional, for price change detection)
3. Calculate available inventory (total - held reservations)
4. Verify sufficient quantity available
5. Create reservations with HELD status
6. Create order and order items atomically

### 3. Reservation Lifecycle
- **HELD**: Created at order time, expires after TTL if not confirmed
- **COMMITTED**: When order moves to PICKING status, inventory is deducted
- **RELEASED**: On cancellation or TTL expiry, inventory is freed

### 4. Inventory Deduction Strategy
When committing reservations:
- Use FEFO (First Expiry, First Out) for perishable goods
- Deduct from inventory items ordered by expiry date ascending

### 5. Error Handling
Custom exceptions with structured error details:
- `InsufficientStockException`: Lists products with insufficient stock
- `PriceChangedException`: Lists products with price changes
- `ProductUnavailableException`: Lists unavailable product IDs

## Consequences

### Positive
- **Prevents overselling**: Concurrent orders cannot claim same inventory
- **Atomic operations**: No partial orders on failure
- **Clear error messages**: Users know exactly which items are problematic
- **Race condition safe**: Serializable isolation prevents phantom reads
- **Graceful degradation**: Held reservations auto-expire, preventing deadlocks

### Negative
- **Performance overhead**: Serializable transactions may cause retries under high load
- **Complexity**: Additional table and status management
- **TTL management**: Need scheduled job to release expired reservations (not implemented in this PR)

### Risks
- Expired reservations need cleanup job (recommended for future PR)
- Under extreme load, transaction retries may impact response times

## Alternatives Considered

### 1. Optimistic Locking
- Update inventory with version check
- Simpler but more prone to conflicts under high load
- **Rejected**: Higher failure rate in concurrent scenarios

### 2. Direct Inventory Deduction at Order Creation
- Deduct immediately, refund on cancellation
- **Rejected**: Requires complex reconciliation for abandoned carts

### 3. Queue-Based Processing
- Process orders sequentially through a queue
- **Rejected**: Adds latency, complexity, and single point of failure

## Implementation Notes

### Files Changed
- `services/api/prisma/schema.prisma`: Added InventoryReservation model
- `services/api/src/modules/orders/orders.service.ts`: Transaction-based order creation
- `services/api/src/common/exceptions/inventory.exception.ts`: Custom exceptions
- `packages/shared-types/src/inventory/index.ts`: Type definitions
- `apps/customer-app/src/screens/CheckoutScreen.tsx`: Error handling UI

### Testing Strategy
- Unit tests with mocked Prisma transactions
- Test scenarios:
  - Successful order with reservations
  - Insufficient stock rejection
  - Price change detection
  - Existing reservation accounting
  - Cancellation with inventory restoration
  - Serializable isolation level verification

### Future Improvements
1. Scheduled job to release expired HELD reservations
2. Admin UI to view and manage reservations
3. Metrics/monitoring for reservation conflicts
4. Consider ReadCommitted isolation with explicit locking for better performance

## References
- [Prisma Interactive Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
