# ADR-0006: Event-Driven Order Flow (BullMQ Jobs)

## Status
Accepted

## Date
2026-01-28

## Context
The order creation and status update flow in the Hypermarket backend was performing multiple synchronous operations:

- **Audit logging**: Recording order events to the database
- **Analytics updates**: Incrementing counters and recording metrics
- **Notifications**: (Future) Sending SMS/Push notifications

These operations:
1. Added latency to the main order flow (customer-facing API)
2. Could cause order creation to fail if any secondary operation failed
3. Made the codebase harder to test (tight coupling)
4. Blocked future scaling requirements

Production-grade order systems need:
1. Fast, responsive order creation/update endpoints
2. Decoupled secondary operations that don't block the main flow
3. Retry mechanisms for failed background tasks
4. Clear separation of concerns

## Decision

### 1. BullMQ Queue for Order Events
Use the existing BullMQ infrastructure (already configured for analytics jobs) to process order events asynchronously.

**Queue Name**: `order-events`

**Job Types**:
- `order-created` - After successful order creation
- `order-status-changed` - After status transitions
- `order-picker-assigned` - After picker assignment
- `order-cancelled` - After order cancellation

**Default Job Options**:
```typescript
{
  removeOnComplete: 100,  // Keep last 100 completed jobs
  removeOnFail: 50,       // Keep last 50 failed jobs
  attempts: 3,            // Retry up to 3 times
  backoff: {
    type: 'exponential',
    delay: 3000,          // 3s, 6s, 12s
  },
}
```

### 2. Event Emission Pattern
Jobs are emitted **after** the main database operation succeeds, but **outside** the response path:

```typescript
// In OrdersService.create()
const order = await this.prisma.order.create({...});

// Emit async - doesn't block response
this.emitOrderCreated(order).catch(err => {
  this.logger.warn('Failed to emit event', err);
});

return order; // Returns immediately
```

**Key Principle**: Job emission failures are logged but never fail the main operation.

### 3. Processor Responsibilities
The `OrderEventsProcessor` handles each job type:

| Job | Audit Log | Analytics | Notification |
|-----|-----------|-----------|--------------|
| `order-created` | CREATE action | Placeholder | Placeholder |
| `order-status-changed` | STATUS_CHANGE action | Placeholder | Status-specific |
| `order-picker-assigned` | ASSIGNMENT action | - | Picker notification |
| `order-cancelled` | UPDATE action | Placeholder | Customer notification |

**Notification Status**: Currently placeholder (logs only). Full notification system deferred to future PR.

### 4. Idempotency
Jobs are designed to be idempotent:
- Unique `jobId` prevents duplicate processing
- Audit logs include source metadata to identify reprocessed events
- No side effects that depend on previous state

### 5. Error Handling
- **Processor errors**: Logged with structured logging, job retried
- **Audit log failures**: Logged but don't fail the job (graceful degradation)
- **Queue unavailable**: Main operations still succeed, event lost (acceptable trade-off)

## What's NOT Included (Deferred)

| Feature | Reason for Deferral | Target PR |
|---------|---------------------|-----------|
| Kafka/Event Streaming | Overkill for current scale | Post-MVP |
| Full Notification System | Requires SMS/Push infrastructure | PR#8+ |
| Real-time Analytics | Requires time-series DB | Post-MVP |
| Event Sourcing | Architectural shift | Post-MVP |
| Dead Letter Queue Dashboard | Need monitoring UI first | Future |

## Architecture

```
services/api/src/modules/orders/
├── orders.module.ts         # Registers BullModule queue
├── orders.service.ts        # Emits jobs after operations
├── queues/
│   ├── order-events.constants.ts  # Queue name, job types
│   └── order-events.types.ts      # Payload interfaces
└── processors/
    └── order-events.processor.ts  # Job handlers
```

**Data Flow**:
```
┌─────────────────┐         ┌─────────────────┐
│  OrdersService  │         │    Redis        │
│  (main flow)    │         │    (BullMQ)     │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ 1. Create order           │
         │ 2. Return response        │
         │ 3. Emit job (async)──────>│
         │                           │
         │         ┌─────────────────┼─────────────────┐
         │         │                 ▼                 │
         │         │  ┌──────────────────────────┐     │
         │         │  │  OrderEventsProcessor    │     │
         │         │  │  - Audit log             │     │
         │         │  │  - Analytics (placeholder)│    │
         │         │  │  - Notification (future) │     │
         │         │  └──────────────────────────┘     │
         │         └───────────────────────────────────┘
```

## Consequences

### Positive
- Order creation is faster (no blocking secondary operations)
- Order creation never fails due to audit/notification failures
- Clear separation between core order logic and side effects
- Built-in retry mechanism for transient failures
- Easy to add new event handlers without modifying core code
- Testable in isolation

### Negative
- Added complexity (queue management)
- Events could be lost if Redis unavailable
- Audit logs may have slight delay (usually < 1s)
- Need to monitor queue health

### Neutral
- Same Redis instance as analytics queue (no additional infrastructure)
- BullMQ dashboard available for job inspection (if needed)

## Testing

### Manual Testing
1. **Create order**:
   ```bash
   curl -X POST /orders -d '{"items": [...], "customerPhone": "..."}'
   # Check: Response fast, audit_log table has entry within 1s
   ```

2. **Update status**:
   ```bash
   curl -X PATCH /orders/:id/status -d '{"status": "PICKING"}'
   # Check: audit_log has STATUS_CHANGE entry
   ```

3. **Queue inspection**:
   ```bash
   redis-cli
   > KEYS bull:order-events:*
   > LRANGE bull:order-events:completed 0 10
   ```

### Verification
- [ ] Order creation returns in < 100ms (excluding DB latency)
- [ ] Audit logs appear within 5 seconds
- [ ] Failed jobs are retried (check `bull:order-events:failed`)
- [ ] Main operations succeed even if Redis down

## Related
- PR#6: Event-Driven Order Flow
- ADR-0003: Global Error Handling (structured logging pattern)
- Future: Full Notification System (SMS/Push)
