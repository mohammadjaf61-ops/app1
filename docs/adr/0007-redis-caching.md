# ADR 0007: Redis Caching Strategy

## Status

Accepted

## Date

2026-01-28

## Context

The Hypermarket API serves multiple clients (admin web, customer app, driver
app, picker app) with frequent reads on product catalogs and categories. Without
caching, every request hits the PostgreSQL database directly, which:

1. Increases database load unnecessarily for static/semi-static data
2. Adds latency to commonly accessed endpoints
3. Limits scalability as client count grows

Redis is already deployed for BullMQ job queues, making it a natural choice for
caching.

## Decision

Implement read-through caching with explicit invalidation for the following
read-heavy paths:

### What IS Cached

| Data                  | Cache Key Pattern          | TTL    | Rationale                       |
| --------------------- | -------------------------- | ------ | ------------------------------- |
| Product by ID         | `product:id:v1:{id}`       | 10 min | Frequent lookups by mobile apps |
| Product by SKU        | `product:sku:v1:{sku}`     | 10 min | POS/scanner lookups             |
| Category list         | `categories:list:v1`       | 15 min | Homepage display                |
| Category tree         | `categories:tree:v1`       | 15 min | Navigation menus                |
| Category by ID        | `category:id:v1:{id}`      | 15 min | Category detail pages           |
| Category by slug      | `category:slug:v1:{slug}`  | 15 min | URL-based lookups               |
| Catalog category tree | `catalog:category-tree:v1` | 15 min | Mobile app navigation           |

### What is NOT Cached

| Data                       | Reason                                            |
| -------------------------- | ------------------------------------------------- |
| Product lists with filters | Dynamic filters + pagination = low cache hit rate |
| Orders                     | Frequently changing, user-specific, sensitive     |
| Inventory levels           | Real-time accuracy required                       |
| User data                  | Security sensitive, frequently changing           |
| Authentication tokens      | Security sensitive                                |

### Cache Invalidation Strategy

**Write-through invalidation**: On any mutation (create/update/delete), relevant
cache keys are explicitly deleted.

```
Product mutations:
- Delete: product:id:v1:{id}
- Delete: product:sku:v1:{sku}
- If SKU changed: Delete new SKU key too

Category mutations:
- Delete: categories:list:v1
- Delete: categories:tree:v1
- Delete: catalog:category-tree:v1
- Delete: category:id:v1:{id}
- Delete: category:slug:v1:{slug}
```

### Implementation Details

1. **CacheService** (`services/api/src/modules/cache/cache.service.ts`)
   - Thin wrapper around ioredis
   - Graceful degradation: cache failures don't break the app
   - Structured logging for cache hits/misses (debug level)
   - Methods: `get<T>`, `set`, `del`, `delPattern`

2. **Key Versioning**
   - All keys include `:v1` suffix
   - Allows cache busting on schema changes by incrementing version

3. **TTL Values**
   - Products: 10 minutes (moderate change frequency)
   - Categories: 15 minutes (lower change frequency)

## Consequences

### Positive

- Reduced database load for read-heavy endpoints
- Lower latency for commonly accessed data
- No external dependencies (Redis already deployed)
- Graceful degradation if Redis is unavailable

### Negative

- Added complexity in mutation paths (must invalidate)
- Potential for stale data within TTL window
- Cache warmup on cold start

### Risks & Mitigations

| Risk                      | Mitigation                                                 |
| ------------------------- | ---------------------------------------------------------- |
| Stale data after mutation | Explicit invalidation on all CUD operations                |
| Cache stampede            | TTL is long enough; future: implement locking if needed    |
| Memory pressure           | Fixed TTLs ensure automatic eviction; monitor Redis memory |
| Redis unavailable         | Graceful degradation - app works without cache             |

## Testing

### Cache Hit Verification

```bash
# First request - cache miss (check logs)
curl http://localhost:3000/api/categories

# Second request - cache hit (check logs)
curl http://localhost:3000/api/categories

# Update category - triggers invalidation
curl -X PATCH http://localhost:3000/api/categories/{id} -d '{"nameAr":"test"}'

# Third request - cache miss again
curl http://localhost:3000/api/categories
```

### Log Output Examples

```json
{"event":"cache_miss","key":"categories:list:v1"}
{"event":"cache_set","key":"categories:list:v1","ttl":900}
{"event":"cache_hit","key":"categories:list:v1"}
{"event":"cache_del","key":"categories:list:v1"}
```

## References

- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
