# ADR-0004: Customer App Offline-First (Minimum Viable)

## Status
Accepted

## Date
2026-01-28

## Context
The customer-app needs to handle network interruptions gracefully without crashing or confusing users. Currently:

- App crashes or shows cryptic errors when network is unavailable
- Users cannot browse previously loaded products offline
- No visual indication of offline state
- Order creation fails without clear explanation

This ADR covers a **minimum viable** offline solution for the customer app. Driver and picker apps already have their own offline handling (SQLite-based sync for delivery/picking operations).

## Decision
Implement a simple read-through cache pattern for customer-app with clear offline UX:

### Network Detection
- Use `@react-native-community/netinfo` for reliable network state detection
- Create `networkService` singleton in `@hypermarket/mobile-core` for centralized state management
- Provide `useNetworkStatus()` hook for React components

### Caching Strategy
- **Read-through cache**: Cache API responses on successful fetch
- **Cache scope**: Products and categories only (cacheable GET endpoints)
- **TTL policy**:
  - Categories: 24 hours (rarely change)
  - Products: 1 hour (prices/availability may change)
- **Storage**: AsyncStorage with JSON serialization
- **No write caching**: Order creation requires online (no queue)

### UI States
1. **Offline Banner**: Shows at top of app when offline
2. **Stale Data Indicator**: "(بيانات محفوظة)" when serving from cache
3. **Checkout Disabled**: Button disabled with clear message
4. **Retry Button**: On banner to manually check connection

### API Client Changes
- GET requests check cache when offline
- POST/PUT/PATCH/DELETE throw clear offline error
- Network errors fall back to cache if available

## What's NOT Included (Deferred)
The following are explicitly **out of scope** for this PR:

1. **Offline order queue**: Orders cannot be created offline
2. **Background sync**: No automatic retry/sync of failed operations
3. **Conflict resolution**: Not needed since we don't cache writes
4. **SQLite storage**: AsyncStorage is sufficient for read cache
5. **Driver/Picker offline**: Already handled separately with SQLite

## Consequences

### Positive
- App no longer crashes on network loss
- Users can browse products/categories offline
- Clear visual feedback about network state
- No complex sync logic to maintain
- Minimal storage footprint (AsyncStorage)

### Negative
- Users cannot place orders offline
- Cached data may become stale
- No guarantee of price accuracy in offline mode

### Neutral
- Additional dependency: `@react-native-community/netinfo`
- Slight increase in app complexity for caching

## Implementation Details

### Files Added
- `packages/mobile-core/src/network/network-service.ts` - Network state management
- `packages/mobile-core/src/network/useNetworkStatus.ts` - React hook
- `packages/mobile-core/src/cache/offline-cache.ts` - Cache utilities
- `packages/mobile-ui/src/components/OfflineBanner.tsx` - UI component

### Files Modified
- `apps/customer-app/App.tsx` - Network initialization, banner
- `apps/customer-app/src/services/api-client.ts` - Cache integration
- `apps/customer-app/src/screens/CheckoutScreen.tsx` - Offline disabled

## Testing
1. Enable Airplane mode on device
2. Open app → should show offline banner
3. Navigate to home → should show cached products (if previously loaded)
4. Try checkout → button should be disabled with message
5. Disable Airplane mode → banner should disappear

## Related
- PR#4: Customer App Offline-First
- ADR-0003: Global Error Handling (error boundaries)
