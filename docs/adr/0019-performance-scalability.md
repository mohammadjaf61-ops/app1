# ADR 0019: Performance & Scalability Optimizations (Hot Paths)

## Status

Accepted

## Context

As the hypermarket platform grows, certain code paths become performance bottlenecks. Analysis identified the following hot paths requiring optimization:

1. **Order Creation Flow** - High-frequency operation during peak hours
2. **Inventory Checks** - Sequential validation causing latency
3. **Reports Aggregations** - In-memory processing of large datasets
4. **Demand Forecasting** - Sequential product processing

### Identified Issues

| Area | Issue | Impact |
|------|-------|--------|
| Inventory Service | Sequential product/location validation | 2x DB round trips |
| Reports Service | In-memory aggregation of order items | Memory pressure, slow for large datasets |
| DemandForecast | Sequential product processing | O(n) DB calls for n products |
| Pagination | Unbounded queries allowed | Memory exhaustion risk |
| Database | Missing composite indexes | Full table scans |

## Decision

We implemented targeted optimizations for each hot path:

### 1. Database Indexes

Added composite indexes for common query patterns:

```prisma
// Order table - status + date filtering
@@index([status, createdAt], map: "idx_order_status_created_at")
@@index([status, pickerId], map: "idx_order_status_picker_id")

// Product table - active products query
@@index([isActive, deletedAt], map: "idx_product_active_not_deleted")

// Delivery assignment - driver performance
@@index([driverId, status], map: "idx_delivery_driver_status")
```

### 2. Parallel Validation (Inventory Service)

**Before:**
```typescript
const product = await prisma.product.findFirst({ ... });
const location = await prisma.inventoryLocation.findUnique({ ... });
```

**After:**
```typescript
const [product, location] = await Promise.all([
  prisma.product.findFirst({ ... }),
  prisma.inventoryLocation.findUnique({ ... }),
]);
```

### 3. DB Aggregations (Reports Service)

**Before:** Fetch all records, aggregate in JavaScript
```typescript
const orderItems = await prisma.orderItem.findMany({ ... });
// In-memory aggregation loop
```

**After:** Use PostgreSQL GROUP BY
```typescript
const results = await prisma.$queryRaw`
  SELECT product_id, SUM(quantity) as total_quantity, ...
  FROM order_item oi
  JOIN "order" o ON oi.order_id = o.id
  WHERE o.status IN ('DELIVERED', 'COMPLETED')
  GROUP BY product_id
  LIMIT ${limit}
`;
```

Optimized methods:
- `getTopProducts()` - DB GROUP BY with ORDER BY
- `getDailySales()` - DB GROUP BY DATE()
- `getSalesReport()` - DB GROUP BY order_type

### 4. Batch Processing (DemandForecast Service)

**Before:** Sequential processing
```typescript
for (const product of products) {
  await this.forecastProduct(product.id, ...);
}
```

**After:** Parallel batches
```typescript
const BATCH_SIZE = 10;
for (let i = 0; i < products.length; i += BATCH_SIZE) {
  const batch = products.slice(i, i + BATCH_SIZE);
  await Promise.all(
    batch.map(product => this.forecastProduct(product.id, ...))
  );
}
```

Also parallelized forecast upserts within `forecastProduct()`.

### 5. Pagination Limits

Added centralized pagination constants:

```typescript
// services/api/src/common/constants/pagination.constants.ts
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function clampPageSize(limit?: number): number {
  if (!limit || limit < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}
```

Applied to:
- `OrdersService.findAll()`
- `ProductsService.findAll()`

## Consequences

### Positive

1. **Reduced DB Round Trips** - Parallel validation cuts latency in half
2. **Lower Memory Usage** - DB aggregations avoid loading large datasets
3. **Faster Reports** - GROUP BY pushes computation to optimized DB engine
4. **Scalable Forecasting** - Batch processing enables horizontal scaling
5. **DoS Protection** - Pagination limits prevent unbounded queries
6. **Query Performance** - Composite indexes eliminate full table scans

### Negative

1. **Complexity** - Raw SQL queries require more maintenance
2. **Testing** - DB aggregations harder to unit test (need integration tests)
3. **Portability** - PostgreSQL-specific SQL syntax

### Performance Estimates

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Inventory setInventory | 2 sequential queries | 1 parallel batch | ~50% faster |
| getTopProducts (1000 orders) | O(n) memory + JS loop | Single DB query | ~10x faster |
| getDailySales (30 days) | O(n) memory | Single DB query | ~5x faster |
| generateForecasts (100 products) | 100 sequential calls | 10 parallel batches | ~5x faster |

## Future Enhancements

1. **Query Caching** - Cache expensive report queries in Redis
2. **Read Replicas** - Route reports to read replica
3. **Materialized Views** - Pre-compute daily aggregations
4. **Connection Pooling** - Tune PgBouncer for parallel queries
5. **Query Monitoring** - Add slow query logging

## Related

- ADR 0001: Architecture Guidelines
- `services/api/src/common/constants/pagination.constants.ts`
- `services/api/src/modules/reports/reports.service.ts`
- `services/api/src/modules/analytics/services/demand-forecast.service.ts`
- `services/api/prisma/schema.prisma` (indexes)
