# Operations Runbook - Hypermarket Platform

This runbook provides step-by-step procedures for common operational tasks and incident response.

## Table of Contents

1. [Service Health Monitoring](#service-health-monitoring)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [Job Queue Management](#job-queue-management)
4. [Database Operations](#database-operations)
5. [Cache Operations](#cache-operations)
6. [Emergency Procedures](#emergency-procedures)

---

## Service Health Monitoring

### Check All Services Status

```bash
# Check infrastructure containers
docker-compose ps

# Check API health
curl -s http://localhost:3000/api/health | jq

# Check Redis
redis-cli ping

# Check PostgreSQL
pg_isready -h localhost -p 5432 -U hypermarket
```

### Expected Health Response

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

---

## Common Issues & Solutions

### Issue: Orders Not Being Placed

**Symptoms:**
- Customers cannot place orders
- API returns 500 errors
- Order creation hangs

**Diagnosis Steps:**

```bash
# 1. Check API logs
docker logs hypermarket-api --tail 100

# 2. Check database connectivity
psql -h localhost -U hypermarket -d hypermarket_dev -c "SELECT 1"

# 3. Check if orders table is accessible
psql -h localhost -U hypermarket -d hypermarket_dev -c "SELECT COUNT(*) FROM \"order\""

# 4. Check for locks
psql -h localhost -U hypermarket -d hypermarket_dev -c "
  SELECT pid, state, query, wait_event_type
  FROM pg_stat_activity
  WHERE state != 'idle'
"
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Database connection pool exhausted | Restart API: `docker restart hypermarket-api` |
| Table locks | Kill blocking queries (see below) |
| Disk full | Free disk space, clear logs |
| Memory exhausted | Restart services, investigate memory leak |

### Issue: Orders Not Visible to Pickers

**Symptoms:**
- Orders placed but picker app shows empty queue
- Orders stuck in PENDING status

**Diagnosis Steps:**

```bash
# 1. Check order status distribution
psql -h localhost -U hypermarket -d hypermarket_dev -c "
  SELECT status, COUNT(*)
  FROM \"order\"
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY status
"

# 2. Check if Redis is receiving updates
redis-cli MONITOR  # Watch real-time (Ctrl+C to stop)

# 3. Check job queue status
redis-cli LLEN bull:analytics:wait
redis-cli LLEN bull:analytics:active
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Redis down | Restart Redis: `docker restart hypermarket-redis` |
| WebSocket disconnected | Refresh picker app, check network |
| Order assignment missing | Manually assign picker via admin panel |

### Issue: Redis Connection Failed

**Symptoms:**
- `ECONNREFUSED` errors in logs
- Caching not working
- Job queues stuck

**Diagnosis Steps:**

```bash
# 1. Check Redis container
docker logs hypermarket-redis --tail 50

# 2. Check if port is listening
nc -zv localhost 6379

# 3. Check Redis memory
redis-cli INFO memory | grep used_memory_human

# 4. Check connected clients
redis-cli CLIENT LIST
```

**Solutions:**

```bash
# Restart Redis
docker restart hypermarket-redis

# If memory exhausted, flush cache (NOT queues)
redis-cli FLUSHDB  # Warning: clears all cache

# If persistent issues, recreate container
docker-compose down redis
docker-compose up -d redis
```

### Issue: API Performance Degradation

**Symptoms:**
- Slow response times (> 500ms)
- Timeouts
- High CPU/memory

**Diagnosis Steps:**

```bash
# 1. Check API resource usage
docker stats hypermarket-api

# 2. Check database slow queries
psql -h localhost -U hypermarket -d hypermarket_dev -c "
  SELECT pid, now() - query_start as duration, query
  FROM pg_stat_activity
  WHERE state != 'idle'
  AND now() - query_start > interval '5 seconds'
"

# 3. Check Redis latency
redis-cli --latency

# 4. Check connection pool status
psql -h localhost -U hypermarket -d hypermarket_dev -c "
  SELECT count(*) FROM pg_stat_activity WHERE datname = 'hypermarket_dev'
"
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Slow queries | Add indexes, optimize queries |
| Connection pool exhausted | Increase pool size, restart API |
| Memory leak | Restart API, investigate with heap dump |
| Redis latency | Check Redis memory, restart if needed |

---

## Job Queue Management

### Background Jobs Overview

| Queue | Job | Schedule | Purpose |
|-------|-----|----------|---------|
| `analytics` | `daily-sales-aggregation` | Daily 2 AM | Compute daily sales metrics |
| `analytics` | `product-analytics` | Daily 3 AM | Product performance metrics |
| `analytics` | `anomaly-detection` | Every 6 hours | Detect sales anomalies |
| `analytics` | `stock-status-refresh` | Every hour | Refresh materialized views |

### Check Queue Status

```bash
# List all queues
redis-cli KEYS "bull:*"

# Check waiting jobs
redis-cli LLEN bull:analytics:wait

# Check active jobs
redis-cli LLEN bull:analytics:active

# Check failed jobs
redis-cli LLEN bull:analytics:failed

# Check completed jobs count
redis-cli GET bull:analytics:id
```

### View Failed Jobs

```bash
# List failed jobs
redis-cli LRANGE bull:analytics:failed 0 10

# Get details of a failed job
redis-cli HGETALL bull:analytics:<job-id>
```

### Retry Failed Jobs

```bash
# Via Redis CLI - move from failed to wait
redis-cli RPOPLPUSH bull:analytics:failed bull:analytics:wait

# Retry all failed jobs (use with caution)
while [ $(redis-cli LLEN bull:analytics:failed) -gt 0 ]; do
  redis-cli RPOPLPUSH bull:analytics:failed bull:analytics:wait
done
```

### Clear Stuck Jobs

```bash
# Clear active jobs (stuck jobs)
redis-cli DEL bull:analytics:active

# Clear all waiting jobs
redis-cli DEL bull:analytics:wait

# Clear failed jobs
redis-cli DEL bull:analytics:failed
```

### Manually Trigger Jobs

Jobs are triggered via the API scheduler. To manually trigger:

```bash
# Trigger daily aggregation
curl -X POST http://localhost:3000/api/analytics/trigger/daily-aggregation \
  -H "Authorization: Bearer <admin-token>"

# Trigger stock refresh
curl -X POST http://localhost:3000/api/analytics/trigger/stock-refresh \
  -H "Authorization: Bearer <admin-token>"
```

---

## Database Operations

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('hypermarket_dev'));
```

### Check Table Sizes

```sql
SELECT
  relname as table,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
```

### Kill Long-Running Queries

```sql
-- Find long queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state != 'idle'
AND now() - query_start > interval '5 minutes';

-- Kill specific query
SELECT pg_terminate_backend(<pid>);
```

### Check and Fix Bloated Tables

```sql
-- Check table bloat
SELECT relname, n_dead_tup, n_live_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Run vacuum
VACUUM ANALYZE "order";
VACUUM ANALYZE order_item;
```

### Index Maintenance

```sql
-- Check unused indexes
SELECT
  schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';

-- Reindex table
REINDEX TABLE "order";
```

---

## Cache Operations

### View Cache Contents

```bash
# List all keys (use SCAN in production)
redis-cli KEYS "*"

# Get key type
redis-cli TYPE <key>

# Get key TTL
redis-cli TTL <key>

# Get string value
redis-cli GET <key>

# Get hash value
redis-cli HGETALL <key>
```

### Clear Specific Cache

```bash
# Clear user session
redis-cli DEL "session:<user-id>"

# Clear product cache
redis-cli KEYS "product:*" | xargs redis-cli DEL

# Clear all cache (preserves queues)
redis-cli KEYS "cache:*" | xargs redis-cli DEL
```

### Full Cache Reset

```bash
# Warning: This clears EVERYTHING including job queues
redis-cli FLUSHALL

# Safer: Flush only current database
redis-cli FLUSHDB
```

---

## Emergency Procedures

### Complete System Restart

```bash
# 1. Stop all services
docker-compose down

# 2. Clear any stuck state (optional)
docker volume prune -f

# 3. Start infrastructure
docker-compose up -d

# 4. Wait for healthy status
sleep 30
docker-compose ps

# 5. Restart API
docker restart hypermarket-api

# 6. Verify health
curl http://localhost:3000/api/health
```

### Database Emergency Recovery

```bash
# 1. Stop API to prevent writes
docker stop hypermarket-api

# 2. Connect to database
psql -h localhost -U hypermarket -d hypermarket_dev

# 3. Check for corruption
\dt  -- List tables
SELECT COUNT(*) FROM "order";  -- Test queries

# 4. If needed, restore from backup (see BACKUP_RECOVERY.md)

# 5. Restart API
docker start hypermarket-api
```

### Rollback Deployment

```bash
# 1. Stop current API
docker stop hypermarket-api

# 2. Switch to previous image
docker tag hypermarket-api:latest hypermarket-api:rollback
docker tag hypermarket-api:previous hypermarket-api:latest

# 3. Start API
docker start hypermarket-api

# 4. Verify
curl http://localhost:3000/api/health
```

---

## Monitoring Checklist

### Daily Checks

- [ ] API health endpoint returns OK
- [ ] No failed jobs in queues
- [ ] Database connections < 80% of pool
- [ ] Disk usage < 80%
- [ ] No error spikes in logs

### Weekly Checks

- [ ] Review slow query logs
- [ ] Check table bloat and vacuum
- [ ] Review failed job patterns
- [ ] Check backup success
- [ ] Review audit logs for anomalies

### Monthly Checks

- [ ] Database index optimization
- [ ] Cache hit rate analysis
- [ ] Storage capacity planning
- [ ] Security patch review
- [ ] Performance benchmark comparison

---

## Contact & Escalation

| Level | Contact | When |
|-------|---------|------|
| L1 | On-call operator | Service degradation |
| L2 | Technical lead | Data issues, complex bugs |
| L3 | Database admin | Database corruption, performance |
| Emergency | All hands | Complete system failure |
