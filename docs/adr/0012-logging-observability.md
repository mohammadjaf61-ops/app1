# ADR 0012: Structured Logging & Request Correlation

## Status
Accepted

## Date
2026-01-28

## Context
The application had scattered console.log statements and inconsistent logging formats, making debugging and troubleshooting difficult. We need:
- Structured JSON logs for log aggregation (ELK, CloudWatch, etc.)
- Request correlation IDs propagated through all layers
- Consistent log levels (debug/log/warn/error)
- No sensitive data leakage in logs
- Background job context tracking

## Decision

### Observability Module Architecture

Created `src/common/observability/` with three components:

```
common/observability/
├── request-context.ts      # AsyncLocalStorage for context propagation
├── request-context.middleware.ts  # Middleware to initialize context
├── structured-logger.ts    # JSON logger with auto-context
└── index.ts
```

### Request Context (AsyncLocalStorage)

Uses Node.js AsyncLocalStorage for zero-overhead context propagation:

```typescript
interface RequestContextData {
  requestId: string;
  startTime: number;
  userId?: string;
  method?: string;
  path?: string;
}

// Access from anywhere in call stack
const requestId = RequestContext.getRequestId();

// Run code within context (for background jobs)
RequestContext.runAsync(context, async () => {
  // All logs here will include the requestId
});
```

### Structured Logger

JSON output format:

```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601
  level: string;          // error|warn|log|debug
  service: string;        // hypermarket-api
  requestId: string;      // UUID from context
  message: string;        // Human-readable message
  context?: string;       // Logger context (class name)
  durationMs?: number;    // Time since request start
  meta?: Record<string, unknown>; // Additional data
}
```

Example output:
```json
{
  "timestamp": "2026-01-28T14:30:00.000Z",
  "level": "log",
  "service": "hypermarket-api",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Request completed",
  "context": "HTTP",
  "durationMs": 45,
  "meta": {
    "method": "GET",
    "url": "/api/v1/products",
    "statusCode": 200
  }
}
```

### Request Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ Client Request                                                    │
│   x-request-id: abc123 (optional)                                │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ RequestContextMiddleware                                          │
│   - Generate/extract requestId                                   │
│   - Initialize AsyncLocalStorage                                 │
│   - Set response headers                                         │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ Controllers → Services → Repositories                            │
│   - All logs automatically include requestId                     │
│   - StructuredLogger.log('message', { meta })                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ Response                                                          │
│   x-request-id: abc123                                           │
│   x-correlation-id: abc123                                       │
└──────────────────────────────────────────────────────────────────┘
```

### Log Levels

| Level | When to Use |
|-------|-------------|
| `error` | Server errors (5xx), unrecoverable failures |
| `warn` | Client errors (4xx), potential issues |
| `log` | Normal operations, request completion |
| `debug` | Development details (disabled in production) |

### Background Jobs

Jobs create their own context with prefixed requestId:

```typescript
RequestContext.createJobContext('daily-sales-aggregation', job.id)
// requestId: "job-daily-sales-aggregation-abc123"
```

### Sensitive Data Filtering

StructuredLogger automatically redacts:
- password, token, secret
- apiKey, authorization, cookie
- creditCard, cvv

### Frontend Integration

API clients capture requestId from response headers:

```typescript
interface ApiError {
  statusCode: number;
  message: string;
  errorCode: string;
  requestId?: string; // For debugging/support
}
```

## Files Modified/Created

### Backend
- `services/api/src/common/observability/` (new module)
- `services/api/src/main.ts` - Added middleware, removed console.log
- `services/api/src/common/interceptors/logging.interceptor.ts` - Use StructuredLogger
- `services/api/src/common/filters/http-exception.filter.ts` - Use StructuredLogger
- `services/api/src/modules/analytics/processors/analytics.processor.ts` - Job context

### Frontend
- `apps/admin-web/src/lib/api-client.ts` - Capture requestId
- `apps/customer-app/src/services/api-client.ts` - Capture requestId

## Alternatives Considered

### 1. Winston/Pino
Considered but NestJS Logger is sufficient for MVP. Can migrate later if needed.

### 2. OpenTelemetry
Deferred - requires infrastructure setup. Current solution is APM-ready.

### 3. Request-scoped Providers
Rejected - AsyncLocalStorage is simpler and works with background jobs.

## Consequences

### Positive
- All logs have consistent JSON format
- Every request can be traced via requestId
- No console.log scattered in codebase
- Background jobs have their own trace context
- Sensitive data automatically filtered
- Ready for log aggregation (ELK, CloudWatch)

### Negative
- AsyncLocalStorage has minimal overhead
- Requires all loggers to use StructuredLogger
- Context lost if using raw setTimeout (use runAsync)

## Debugging with requestId

1. **User reports error**: Get requestId from error screen
2. **Search logs**: `grep "requestId\":\"abc123\"" logs/`
3. **Full trace**: All logs for that request are linked

## Future Improvements

1. Add distributed tracing (OpenTelemetry)
2. Add metrics collection (Prometheus)
3. Add log shipping to cloud (CloudWatch, ELK)
4. Add performance tracking middleware
