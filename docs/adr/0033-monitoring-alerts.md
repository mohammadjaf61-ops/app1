# ADR 0033: Monitoring, Alerts & Operational Thresholds

## Status

Accepted

## Date

2026-01-29

## Context

The Hypermarket Platform needs operational monitoring to:
- Detect failures before they become critical
- Provide visibility into system health
- Enable proactive alerting
- Support VPS deployment without SaaS dependencies

Requirements:
1. No external monitoring services (Prometheus, Datadog, etc.)
2. Lightweight, self-contained solution
3. Works on single VPS deployment
4. Real-time health status
5. Historical metrics (short-term)

## Decision

Implement a local monitoring solution with three components:

### 1. Extended Health Endpoint

`GET /health` now returns comprehensive status:

```typescript
{
  status: 'healthy' | 'unhealthy' | 'degraded',
  timestamp: string,
  version: string,
  uptime: number,
  services: {
    database: { status: 'up' | 'down' | 'degraded', latency?: number },
    redis: { status: 'up' | 'down' | 'degraded', latency?: number },
    queue: { status: 'up' | 'down' | 'degraded', details?: object }
  }
}
```

### 2. Metrics Endpoint

`GET /monitoring/metrics` returns operational metrics:

```typescript
{
  timestamp: string,
  window: '5m',
  requests: {
    total: number,
    perMinute: number,
    errors: number,
    errorRate: number
  },
  latency: {
    avgMs: number,
    p50Ms: number,
    p95Ms: number,
    p99Ms: number
  },
  queue: {
    waiting: number,
    active: number,
    completed: number,
    failed: number,
    lag: number
  },
  system: {
    memoryUsedMb: number,
    memoryTotalMb: number,
    cpuPercent: number
  }
}
```

### 3. Alerts Engine

Internal cron job (30-second interval) that:
- Checks metrics against thresholds
- Logs alerts with severity
- Auto-resolves when conditions normalize
- Deduplicates alerts (5-minute window)

## Operational Thresholds

| Metric | Threshold | Severity |
|--------|-----------|----------|
| Error Rate | > 2% | CRITICAL |
| Queue Lag | > 100 jobs | WARNING |
| Response Time | > 2000ms | WARNING |
| DB Latency | > 1000ms | DEGRADED |
| Redis Latency | > 100ms | DEGRADED |

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /health` | Public | Basic health check |
| `GET /monitoring/metrics` | Public | Current metrics |
| `GET /monitoring/status` | Public | Component health |
| `GET /monitoring/alerts` | Admin | Active alerts |
| `GET /monitoring/thresholds` | Admin | Current thresholds |

## Admin Status Page

New dashboard page at `/dashboard/status` showing:
- Overall system status (OK/DEGRADED/DOWN)
- Component health cards (API, DB, Redis, Workers)
- Real-time metrics (requests/min, error rate, latency)
- System resources (memory, CPU)
- Active alerts list
- Threshold reference

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Monitoring Module                      │
├─────────────────────────────────────────────────────────┤
│  MetricsService          AlertsService                   │
│  ┌─────────────┐        ┌─────────────────────┐         │
│  │ In-memory   │        │ Threshold Checker   │         │
│  │ metrics     │◄───────│ (30s interval)      │         │
│  │ (5min window)│        │                     │         │
│  └──────┬──────┘        │ Alert Deduplication │         │
│         │               │ Alert Logging       │         │
│         ▼               └─────────┬───────────┘         │
│  MetricsInterceptor              │                      │
│  (captures requests)              ▼                      │
│                           Alert Log (in-memory)          │
└─────────────────────────────────────────────────────────┘
```

## Consequences

### Positive
- No external dependencies
- Works on single VPS
- Real-time health visibility
- Proactive alert detection
- Admin dashboard integration

### Negative
- In-memory metrics (lost on restart)
- Limited historical data (5 minutes)
- No distributed alerting

### Neutral
- 30-second check interval balances responsiveness/overhead
- Metrics interceptor adds minimal latency (<1ms)

## Alternatives Considered

1. **Prometheus + Grafana**: Rejected - SaaS/infrastructure complexity
2. **External APM (Datadog, New Relic)**: Rejected - cost and dependency
3. **StatsD + InfluxDB**: Overkill for single VPS deployment
4. **Health checks only**: Insufficient - no proactive alerting

## Future Enhancements

If needed, can add:
- Persistent metrics storage (SQLite/PostgreSQL)
- External alert delivery (SMS, webhook)
- Longer historical windows
- Custom threshold configuration via API

## References

- PR#33: Monitoring, Alerts & Operational Thresholds
- `services/api/src/modules/monitoring/`
- `apps/admin-web/src/app/dashboard/status/`
- `services/api/test/monitoring/monitoring-test.ts`
