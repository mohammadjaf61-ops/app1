# Incident Response Guide - Hypermarket Platform

This guide provides procedures for diagnosing and resolving incidents using the platform's observability features.

## Table of Contents

1. [Log Structure & Request Tracing](#log-structure--request-tracing)
2. [Incident Severity Levels](#incident-severity-levels)
3. [Diagnosis Procedures](#diagnosis-procedures)
4. [Common Incident Patterns](#common-incident-patterns)
5. [Escalation Matrix](#escalation-matrix)
6. [Post-Incident Review](#post-incident-review)

---

## Log Structure & Request Tracing

### Log Entry Format

All logs are structured JSON for easy querying:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "error",
  "service": "hypermarket-api",
  "requestId": "req_abc123xyz",
  "message": "Order creation failed",
  "context": "OrdersService",
  "durationMs": 1523,
  "meta": {
    "orderId": "order_456",
    "userId": "user_789",
    "error": "Insufficient stock"
  }
}
```

### Key Log Fields

| Field | Description | Use Case |
|-------|-------------|----------|
| `requestId` | Unique request identifier | Trace entire request flow |
| `timestamp` | ISO 8601 timestamp | Time-based queries |
| `level` | error, warn, log, debug | Filter by severity |
| `context` | Service/module name | Filter by component |
| `durationMs` | Request duration | Performance analysis |
| `meta` | Additional context | Business logic details |

### Tracing a Request

Every HTTP request gets a unique `requestId` (format: `req_<uuid>`). Use this to trace the complete request flow:

```bash
# Find all logs for a specific request
grep "req_abc123xyz" /var/log/hypermarket-api/*.log

# Or with structured logging tools
jq 'select(.requestId == "req_abc123xyz")' /var/log/hypermarket-api/app.log
```

### Request ID in Error Responses

All API error responses include the requestId for correlation:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "requestId": "req_abc123xyz",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Tell customers/support to always provide the requestId when reporting issues.**

---

## Incident Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|------------|---------------|----------|
| **P1 - Critical** | Complete service outage | Immediate | API down, database unreachable |
| **P2 - High** | Major feature unavailable | < 30 min | Orders not processing, payments failing |
| **P3 - Medium** | Feature degraded | < 4 hours | Slow performance, partial data |
| **P4 - Low** | Minor issue | < 24 hours | UI bugs, non-critical errors |

---

## Diagnosis Procedures

### Step 1: Initial Assessment

```bash
# 1. Check service health
curl -s http://localhost:3000/api/health | jq

# 2. Check recent errors (last 100 lines)
docker logs hypermarket-api --tail 100 | grep -i error

# 3. Check error rate
docker logs hypermarket-api --since 5m | grep '"level":"error"' | wc -l
```

### Step 2: Identify Affected Component

| Symptom | Likely Component | Check |
|---------|-----------------|-------|
| All requests failing | API / Database | Health endpoint, DB connection |
| Slow responses | Database / Redis | Query performance, cache hit rate |
| Specific endpoint failing | Service code | Filter logs by context |
| Authentication issues | Auth service / JWT | Token validation, user service |
| Job failures | Bull queue / Worker | Queue status, job logs |

### Step 3: Deep Dive Investigation

#### For Database Issues

```bash
# Check connection count
psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'hypermarket_dev'"

# Check active queries
psql -c "SELECT pid, state, query, now() - query_start as duration
         FROM pg_stat_activity
         WHERE state != 'idle' AND datname = 'hypermarket_dev'"

# Check for deadlocks
psql -c "SELECT * FROM pg_locks WHERE NOT granted"
```

#### For Redis Issues

```bash
# Check Redis info
redis-cli INFO | grep -E "connected_clients|used_memory_human|blocked_clients"

# Check slowlog
redis-cli SLOWLOG GET 10

# Monitor commands in real-time
redis-cli MONITOR  # Ctrl+C to stop
```

#### For Job Queue Issues

```bash
# Check queue lengths
redis-cli LLEN bull:analytics:wait
redis-cli LLEN bull:analytics:active
redis-cli LLEN bull:analytics:failed

# Check failed job details
redis-cli LRANGE bull:analytics:failed 0 5
```

### Step 4: Log Analysis

#### Filter by Time Range

```bash
# Logs from last 5 minutes with errors
docker logs hypermarket-api --since 5m 2>&1 | \
  jq -r 'select(.level == "error") | "\(.timestamp) \(.context): \(.message)"'
```

#### Filter by Context

```bash
# All OrdersService logs
docker logs hypermarket-api --since 1h 2>&1 | \
  jq 'select(.context == "OrdersService")'
```

#### Filter by Request ID

```bash
# Trace specific request
docker logs hypermarket-api --since 1h 2>&1 | \
  jq 'select(.requestId == "req_abc123xyz")'
```

#### Find Slow Requests

```bash
# Requests taking > 1000ms
docker logs hypermarket-api --since 1h 2>&1 | \
  jq 'select(.durationMs > 1000) | {timestamp, context, durationMs, message}'
```

---

## Common Incident Patterns

### Pattern 1: Database Connection Pool Exhausted

**Symptoms:**
- Requests timing out
- Logs show "Connection pool exhausted"
- Database shows many idle connections

**Diagnosis:**
```bash
# Check connection count
psql -c "SELECT count(*), state FROM pg_stat_activity
         WHERE datname = 'hypermarket_dev' GROUP BY state"
```

**Resolution:**
1. Kill idle connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes'`
2. Restart API to reset pool
3. Review pool configuration

### Pattern 2: Redis Memory Exhausted

**Symptoms:**
- Cache misses increasing
- Redis returning OOM errors
- Jobs failing to enqueue

**Diagnosis:**
```bash
redis-cli INFO memory | grep -E "used_memory|maxmemory"
redis-cli DBSIZE
```

**Resolution:**
1. Flush cache (not queues): `redis-cli KEYS "cache:*" | xargs redis-cli DEL`
2. Review memory limits
3. Check for memory leaks in key patterns

### Pattern 3: Stuck Orders

**Symptoms:**
- Orders stuck in PENDING/PICKING status
- Pickers/drivers not seeing orders

**Diagnosis:**
```sql
-- Check order status distribution
SELECT status, COUNT(*), MAX(updated_at)
FROM "order"
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Find stuck orders
SELECT id, status, created_at, updated_at
FROM "order"
WHERE status IN ('PENDING', 'PICKING')
AND updated_at < NOW() - INTERVAL '1 hour';
```

**Resolution:**
1. Check picker/driver assignment
2. Verify WebSocket connections
3. Manually reassign if needed via admin panel

### Pattern 4: Authentication Failures Spike

**Symptoms:**
- Login failures increasing
- "Invalid token" errors
- Users getting logged out

**Diagnosis:**
```bash
# Count auth errors
docker logs hypermarket-api --since 1h 2>&1 | \
  jq 'select(.context == "AuthService" and .level == "error")' | wc -l

# Check for patterns
docker logs hypermarket-api --since 1h 2>&1 | \
  jq 'select(.context == "AuthService") | .meta.error' | sort | uniq -c
```

**Resolution:**
1. Verify JWT secrets haven't changed
2. Check token expiration settings
3. Verify Redis session store is working

---

## Escalation Matrix

| Time | P1 (Critical) | P2 (High) | P3 (Medium) |
|------|---------------|-----------|-------------|
| 0-15 min | On-call engineer investigates | On-call notified | Ticket created |
| 15-30 min | Tech lead joined | Investigation starts | Assigned |
| 30-60 min | All hands if unresolved | Tech lead joined | Working |
| 1+ hour | Executive notification | All hands if needed | Review |

### Contact List

| Role | Contact | Hours |
|------|---------|-------|
| On-call Engineer | [Oncall rotation] | 24/7 |
| Tech Lead | [Name/contact] | Business hours + P1 |
| Database Admin | [Name/contact] | P1/P2 database issues |
| Infrastructure | [Name/contact] | P1/P2 infrastructure |

---

## Post-Incident Review

### Incident Report Template

```markdown
## Incident Report: [Title]

**Date:** YYYY-MM-DD
**Duration:** HH:MM - HH:MM (X hours)
**Severity:** P1/P2/P3/P4
**Lead:** [Name]

### Summary
Brief description of what happened.

### Timeline
- HH:MM - Issue first detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Issue resolved

### Root Cause
Detailed explanation of what caused the incident.

### Impact
- Users affected: X
- Orders affected: X
- Revenue impact: X IQD

### Resolution
What was done to fix the issue.

### Prevention
What changes will prevent recurrence:
1. [Action item] - Owner - Due date
2. [Action item] - Owner - Due date

### Lessons Learned
What we learned from this incident.
```

### Post-Incident Checklist

- [ ] Incident documented
- [ ] Root cause identified
- [ ] Timeline verified
- [ ] Impact quantified
- [ ] Prevention actions created
- [ ] Actions assigned owners
- [ ] Review meeting scheduled
- [ ] Knowledge base updated

---

## Quick Reference Card

### Log Queries Cheat Sheet

```bash
# All errors in last hour
docker logs hypermarket-api --since 1h | grep '"level":"error"'

# Specific request trace
docker logs hypermarket-api | grep "req_XXXXX"

# Slow requests (>1s)
docker logs hypermarket-api | jq 'select(.durationMs > 1000)'

# Order service errors
docker logs hypermarket-api | jq 'select(.context == "OrdersService" and .level == "error")'

# Count errors by context
docker logs hypermarket-api --since 1h | jq -r '.context' | sort | uniq -c | sort -rn
```

### Health Check Commands

```bash
# Full system check
curl localhost:3000/api/health && \
redis-cli ping && \
pg_isready -h localhost

# Service status
docker-compose ps

# Resource usage
docker stats --no-stream
```
