# ADR 0017: Reports & Analytics (Operational)

## Status

Accepted

## Context

The hypermarket platform needs operational reports to help the owner and managers track daily business performance. The key requirements are:

1. **Sales visibility**: Understand daily/period revenue, order counts, and breakdown by channel (POS vs Delivery)
2. **Product performance**: Identify top-selling products to inform restocking and promotional decisions
3. **Inventory health**: Quickly identify out-of-stock and low-stock items that need attention

This is an **operational reporting** system, not a business intelligence/analytics platform. The focus is on:
- Fast, simple queries
- Real-time data (not pre-aggregated data warehouses)
- Export capability for further analysis in Excel

## Decision

### Backend Architecture

We implemented three focused report endpoints in the existing `ReportsModule`:

1. **`GET /reports/sales`** - Sales report with POS/Delivery breakdown
   - Date range filtering (optional)
   - Returns: total orders, total revenue, average order value
   - Breaks down by order type (POS vs Delivery)
   - Includes both `DELIVERED` and `COMPLETED` orders

2. **`GET /reports/top-products`** - Top selling products
   - Date range filtering (optional)
   - Sort by quantity or revenue
   - Configurable limit (default 10)
   - Includes product details and category

3. **`GET /reports/inventory`** - Inventory status report
   - No date filtering (current state)
   - Returns products categorized by status:
     - Out of stock (quantity = 0)
     - Low stock (below threshold)
     - Healthy (above threshold)
   - Summary counts for quick overview

### Implementation Details

**Performance Considerations:**
- All queries use Prisma aggregations (`_sum`, `_count`, `groupBy`) directly in the database
- No in-memory loops for aggregation
- Joins are used strategically to minimize N+1 queries
- Product quantities are calculated using `inventoryItems.reduce()` after a single query with includes

**Order Status Handling:**
- Sales reports include orders with status `DELIVERED` (delivery orders) and `COMPLETED` (POS orders)
- This ensures both sales channels are captured in revenue reports

### Frontend Architecture

The admin reports page uses:
- **Tabs** to organize three report types
- **Date pickers** with quick buttons (Today, This Month, Reset)
- **Summary cards** for KPIs
- **Tables** for detailed data
- **CSV export** for each report type

**CSV Export:**
- Client-side CSV generation using native JavaScript
- UTF-8 BOM prefix (`\uFEFF`) for proper Arabic character display in Excel
- Proper escaping of commas and quotes in values

**Empty/Error States:**
- Custom empty state components with helpful messages
- Loading skeletons during data fetch
- React Query for caching and automatic refetching

## Consequences

### Positive

1. **Simple and fast**: Direct database queries without complex aggregation pipelines
2. **Real-time data**: Reports always show current state
3. **Extensible**: Easy to add new report types following the same pattern
4. **Offline-capable**: CSV export allows analysis without internet
5. **Arabic support**: Proper UTF-8 handling for Arabic text in exports

### Negative

1. **Large dataset performance**: As data grows, queries may slow down
   - Mitigation: Add date filtering by default, implement pagination for detailed views
   - Future: Consider materialized views or pre-computed aggregates

2. **No historical comparison**: Current implementation doesn't support period-over-period comparison
   - Can be added as a future enhancement

### Security

- All endpoints protected with `@Roles(UserRole.ADMIN, UserRole.MANAGER)`
- No customer PII in reports (only aggregated data)

## API Reference

### Sales Report
```
GET /reports/sales?dateFrom=2024-01-01&dateTo=2024-01-31

Response:
{
  "summary": {
    "totalOrders": 150,
    "totalRevenue": 45000000,
    "averageOrderValue": 300000,
    "deliveryOrders": 100,
    "deliveryRevenue": 32000000,
    "posOrders": 50,
    "posRevenue": 13000000
  }
}
```

### Top Products
```
GET /reports/top-products?dateFrom=2024-01-01&dateTo=2024-01-31&sortBy=revenue&limit=10

Response:
[
  {
    "rank": 1,
    "product": {
      "id": "uuid",
      "sku": "PROD-001",
      "nameAr": "منتج",
      "category": { "id": "uuid", "nameAr": "قسم" }
    },
    "totalQuantity": 500,
    "totalRevenue": 5000000
  }
]
```

### Inventory Status
```
GET /reports/inventory

Response:
{
  "summary": {
    "totalProducts": 100,
    "outOfStockCount": 5,
    "lowStockCount": 12,
    "healthyCount": 83
  },
  "outOfStock": [...],
  "lowStock": [...]
}
```

## Related

- ADR 0016: POS/Cashier System (defines COMPLETED status for POS orders)
- ADR 0008: Admin Dashboard KPIs (basic dashboard metrics)
