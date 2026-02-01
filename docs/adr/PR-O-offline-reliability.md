# PR-O Offline & Reliability Layer (No Lost Orders)

## Context
Offline-first behavior is required for customer orders: cart edits must work offline, orders must queue and retry without user disruption, and the backend must de-duplicate retries to prevent duplicate orders.

## Decision
1. **Offline cart**
   - Keep existing `zustand + AsyncStorage` persistence for cart state.
   - No network calls inside cart add/remove/quantity changes.

2. **Order queue + retry**
   - Store pending orders locally with a client-generated `id`.
   - Queue is retried automatically when the network is available.
   - Error classification:
     - **Network**: silent retry when online.
     - **Server (>=500)**: retry with capped attempts; if max reached, mark `failed` and allow manual retry.
     - **Validation (400/422)**: no retry; keep reason and show a gentle inline message.

3. **Idempotency (backend)**
   - Clients send headers:
     - `X-Idempotency-Key: <pendingOrder.id>`
     - `X-Client-Request-Id: <pendingOrder.id>`
   - Backend stores `idempotency_key` on `order` and returns the existing order when the same key is received again.

4. **Network awareness**
   - Use shared network state from `packages/mobile-core`.
   - Show a small banner (offline/syncing) via `packages/mobile-ui`.

5. **Observability (dev only)**
   - Dev logs for: order queued, retry, sent, and removed.

## How we prevent duplicate or lost orders
If the server creates an order but the response is lost:
1. The client retries with the same `X-Idempotency-Key`.
2. The API detects the duplicate key and returns the existing order.
3. The queued item is removed after a successful retry response.

## Retry Strategy (Summary)
- **Network error** → keep `pending`, retry when online.
- **Server error (>=500)** → retry with backoff; mark `failed` after max attempts; allow manual retry.
- **Validation error (400/422)** → mark `failed` with message; no auto-retry.

## Out of Scope
- Changes to order payload schema or API contracts.
- New libraries for background processing or telemetry.
- Additional UI flows beyond a small network/sync banner.
