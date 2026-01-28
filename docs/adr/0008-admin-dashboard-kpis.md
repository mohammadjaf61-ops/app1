# ADR 0008: Admin Dashboard with Real KPIs and Data Tables

## Status
Accepted

## Date
2026-01-28

## Context
The admin dashboard previously displayed placeholder data and mock KPIs. For production use, we need real-time key performance indicators (KPIs) that reflect actual business metrics:
- **Total Orders Today**: Number of orders created today
- **Revenue Today**: Total revenue from today's orders
- **Pending Orders**: Orders awaiting processing
- **Out of Stock Count**: Products with zero inventory

Additionally, the Orders and Catalog pages need to display actual data with proper loading states and empty states for production readiness.

## Decision

### Backend: Admin KPIs Endpoint

Created a new `/admin/kpis` endpoint in a dedicated `AdminModule`:

```typescript
// services/api/src/modules/admin/admin.service.ts
export interface AdminKPIs {
  totalOrdersToday: number;
  revenueToday: number;
  pendingOrders: number;
  outOfStockCount: number;
}
```

**Implementation Details:**
1. **Parallel Query Execution**: All four metrics are fetched in parallel using `Promise.all()` to minimize response latency
2. **Redis Caching**: Results are cached for 60 seconds to reduce database load while maintaining near real-time accuracy
3. **Date-Based Filtering**: Today's orders are filtered using midnight-to-midnight range in server timezone
4. **Out of Stock Detection**: Products are considered out of stock when they have either:
   - No inventory items at all
   - All inventory items have quantity = 0

### Frontend: Dashboard Integration

Updated the dashboard to consume real KPIs:

```typescript
// apps/admin-web/src/hooks/use-api.ts
export function useAdminKPIs() {
  return useQuery<AdminKPIs>({
    queryKey: queryKeys.adminKpis,
    queryFn: () => apiClient.get<AdminKPIs>('/admin/kpis'),
    refetchInterval: 60000,  // Auto-refresh every 60 seconds
    staleTime: 30000,        // Consider stale after 30 seconds
  });
}
```

**UI Changes:**
- KPI cards now display real data from the backend
- Removed mock trend indicators (requires historical data comparison)
- Updated card descriptions to reflect actual metrics

### Existing Features Verified

The Orders and Catalog pages already had proper implementations:
- **Data Tables**: Using `@tanstack/react-table` with sorting and pagination
- **Loading States**: Skeleton components displayed during data fetching
- **Empty States**: Arabic-language messages when no data is available
- **Search/Filter**: Status filtering for orders, text search for products

## Alternatives Considered

### 1. Separate Endpoints per KPI
Rejected because it would require 4 HTTP requests instead of 1, increasing latency and complexity.

### 2. Real-time WebSocket Updates
Deferred to future iteration. Current polling with 60-second intervals provides sufficient freshness for admin dashboard use cases while keeping implementation simple.

### 3. Pre-computed Aggregations
Considered using materialized views or scheduled jobs. Rejected for MVP as the query performance is acceptable with proper caching.

## Consequences

### Positive
- Dashboard displays accurate, real-time business metrics
- Single endpoint reduces frontend complexity
- 60-second cache balances freshness with database load
- Consistent loading/empty states across all pages

### Negative
- Out of stock calculation can be expensive for large catalogs (may need optimization)
- No historical comparison data (no trend indicators)
- 60-second staleness acceptable for admin dashboard but not for real-time operations

## Cache Configuration

| Key | TTL | Purpose |
|-----|-----|---------|
| `admin:kpis:v1` | 60s | Near real-time KPI data |

## Security

- Endpoint protected by `@Roles(UserRole.ADMIN, UserRole.MANAGER)`
- JWT authentication required
- No sensitive customer data exposed

## Future Improvements

1. Add trend indicators by comparing with yesterday's data
2. Implement WebSocket for true real-time updates
3. Add time-range selection for KPIs
4. Optimize out-of-stock query with indexed count column
5. Add more granular KPIs (by category, by hour, etc.)
