# ADR-0004: Customer App Offline-First (Minimum Viable)

## Status
Accepted

## Date
2026-01-28

## Context
The customer mobile app (customer-app) needed basic offline support to prevent poor user experience when network connectivity is lost. Without this:

- **App behavior**: API calls fail silently or show generic errors
- **User confusion**: No indication that the device is offline
- **Lost context**: Users lose their browsing state when network drops
- **Critical actions fail**: Order creation fails without clear explanation

The driver-app and picker-app already have offline support with SQLite sync queues. However, customer-app has different requirements - it's primarily a **read-heavy browsing app** where users view products and occasionally place orders.

## Decision

### Scope: Minimum Viable Offline Support
This PR implements the **minimum** offline support needed for acceptable UX, deliberately avoiding complex features.

### 1. Network State Detection
Add `networkService` and `useNetworkStatus` hook to `@hypermarket/mobile-core`:

```typescript
import { useNetworkStatus } from '@hypermarket/mobile-core';

function MyComponent() {
  const { isOnline, isOffline, refresh } = useNetworkStatus();

  if (isOffline) {
    return <OfflineBanner />;
  }
}
```

**Implementation**: Uses `@react-native-community/netinfo` to detect connectivity changes in real-time.

### 2. Read Cache (Products/Categories)
Add `cacheService` for offline data access:

```typescript
// On API success: cache the response
const data = await apiClient.get('/catalog/categories');
await cacheService.set('categories', data, { ttl: 24 * 60 * 60 * 1000 });

// On API failure/offline: read from cache
const cached = await cacheService.get('categories');
if (cached) return cached;
```

**Storage**: Uses AsyncStorage (simple key-value storage)
**TTL Policy**:
- Categories: 24 hours
- Products: 6 hours
- Home offers/recommended: 2 hours

### 3. UI States
Add `OfflineBanner` component for clear offline indication:

```tsx
<OfflineBanner
  showCacheMessage={true}  // "Showing cached data"
  onRetry={handleRefresh}
/>
```

**Placement**: Top of main screens (Home, Categories, Checkout)

### 4. Critical Action Blocking
Disable order creation when offline:

```tsx
<Button
  title={isOffline ? 'Offline - Cannot place order' : 'Confirm Order'}
  disabled={isOffline}
  onPress={handleConfirmOrder}
/>
```

**With explanation**: Alert dialog explains why action is blocked.

## What's NOT Included (Explicitly Deferred)

| Feature | Why Deferred |
|---------|--------------|
| **Two-way sync** | Customer app is read-heavy; orders are rare. Not worth complexity. |
| **Order queue** | Orders involve payment validation, inventory checks - must be online. |
| **Full offline search** | Would require indexing all products locally. Heavy. |
| **Background sync** | Adds complexity; pull-to-refresh is sufficient. |
| **SQLite storage** | AsyncStorage is sufficient for caching read data. |
| **Conflict resolution** | No writes = no conflicts to resolve. |

These features can be added in future PRs if user research shows demand.

## Architecture

```
packages/
└── mobile-core/
    └── src/
        ├── services/
        │   ├── network.ts      # Network state service
        │   └── cache.ts        # Simple cache with TTL
        └── hooks/
            └── useNetworkStatus.ts

apps/
└── customer-app/
    └── src/
        ├── components/layout/
        │   └── OfflineBanner.tsx
        ├── hooks/
        │   └── use-api.ts      # Updated with cache fallback
        └── screens/
            ├── HomeScreen.tsx      # + OfflineBanner
            ├── CategoriesScreen.tsx # + OfflineBanner
            ├── SearchScreen.tsx    # + offline message
            └── CheckoutScreen.tsx  # + action blocking
```

## Dependencies Added
- `@react-native-community/netinfo`: ^11.1.0 (lightweight, standard solution)
- `@react-native-async-storage/async-storage`: 1.21.0 (already used for cart)

**No new heavy dependencies** - only netinfo (~50KB) added.

## Cache Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       API Request                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Is Online?    │
                    └─────────────────┘
                      │           │
                    Yes           No
                      │           │
                      ▼           ▼
              ┌───────────┐   ┌───────────┐
              │ Fetch API │   │ Read Cache│
              └───────────┘   └───────────┘
                    │               │
                    ▼               ▼
              ┌───────────┐   ┌───────────┐
              │Save Cache │   │Return Data│
              └───────────┘   │ (if found)│
                    │         └───────────┘
                    ▼
              ┌───────────┐
              │Return Data│
              └───────────┘
```

## Consequences

### Positive
- App doesn't crash or show confusing errors when offline
- Users clearly see they're offline
- Products/categories viewable from cache
- Order creation blocked with clear explanation
- Minimal code changes, low risk

### Negative
- No offline order queueing (must be online to order)
- Search doesn't work offline
- Cache may become stale if user is offline >24h

### Neutral
- driver-app and picker-app unchanged (already have offline)
- Backend unchanged
- No pricing/inventory logic changed

## Testing Scenarios

### Manual Testing
1. **Airplane mode on Home**:
   - Should show OfflineBanner
   - Products/categories display from cache (if previously loaded)

2. **Airplane mode → Checkout**:
   - Should show offline warning
   - "Confirm Order" button disabled
   - Alert explains why

3. **Airplane mode → Search**:
   - Should show "Search unavailable offline" message

4. **Pull to refresh while offline**:
   - Triggers network refresh
   - If still offline, shows cached data

### Edge Cases
- Fresh install + offline: Shows empty state (no cache)
- Cache expired + offline: Shows expired data (better than nothing)
- Network flaky: Banner appears/disappears correctly

## Related
- PR#4: Offline-First Customer App
- ADR-0003: Global Error Handling (ErrorBoundary used for network errors)
- Future: Enhanced offline with order queue (if needed)
