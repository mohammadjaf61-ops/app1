# ADR-0003: Global Error Handling

## Status
Accepted

## Date
2026-01-28

## Context
The Hypermarket platform lacked unified error handling across its applications. When runtime errors occurred:

- **Mobile apps (React Native)**: Crashed completely, showing white screen or native crash
- **Admin web (Next.js)**: Showed generic Next.js error page without recovery option
- **No structured logging**: Errors were inconsistently logged, making debugging difficult
- **Poor user experience**: Technical error messages sometimes leaked to end users

Production-grade applications need:
1. Graceful error recovery without full app crash
2. User-friendly error messages (in Arabic)
3. Structured error logging for debugging
4. Clear retry/recovery mechanisms

## Decision

### 1. React Native Error Boundaries
Add `ErrorBoundary` component to `@hypermarket/mobile-ui` package:

```typescript
<ErrorBoundary
  onError={(error, info) => logger.error(...)}
  onReset={() => queryClient.clear()}
  fallback={({ error, resetError }) => <ErrorFallback ... />}
>
  <App />
</ErrorBoundary>
```

**Placement**: Wrap the entire app at root level (inside `SafeAreaProvider`, outside `QueryClientProvider`)

**Fallback Component**: `ErrorFallback` displays:
- Arabic error message (generic, user-friendly)
- Retry button
- Error details only in `__DEV__` mode

### 2. Next.js App Router Error Handling
Leverage Next.js built-in error handling conventions:

- `app/error.tsx` - Route segment errors with retry
- `app/global-error.tsx` - Root layout errors (includes own `<html>` tag)
- `app/not-found.tsx` - 404 pages
- `app/dashboard/error.tsx` - Dashboard-specific error boundary

### 3. Structured Logging
Add `createLogger` utility to both `@hypermarket/mobile-core` and admin-web:

```typescript
const logger = createLogger({ scope: 'AuthService' });
logger.error('Login failed', error, { userId, errorCode: 'AUTH_001' });
```

**Log Entry Format**:
```json
{
  "level": "error",
  "scope": "AuthService",
  "message": "Login failed",
  "timestamp": "2026-01-28T10:00:00.000Z",
  "errorCode": "AUTH_001",
  "error": {
    "name": "ApiException",
    "message": "Invalid credentials",
    "stack": "..." // only in dev
  }
}
```

**Behavior**:
- Development: All log levels output to console
- Production: Only `warn` and `error` levels output

### 4. Error Display Rules
- **Never** show technical error messages (stack traces) to end users
- **Always** show generic Arabic error message with retry option
- **Dev mode only**: Show error details for debugging

## What's NOT Included (Deferred)
- APM integration (Sentry, DataDog) - will be added in future PR
- Error reporting service
- Analytics on error frequency
- Offline error queueing

## Architecture

```
packages/
├── mobile-ui/
│   └── src/components/
│       ├── ErrorBoundary.tsx    # React class component
│       └── ErrorFallback.tsx    # Fallback UI
└── mobile-core/
    └── src/utils/
        └── logger.ts            # Structured logging

apps/
├── customer-app/App.tsx         # Wrapped with ErrorBoundary
├── driver-app/App.tsx           # Wrapped with ErrorBoundary
├── picker-app/App.tsx           # Wrapped with ErrorBoundary
└── admin-web/src/
    ├── lib/logger.ts            # Web version of logger
    └── app/
        ├── error.tsx            # Route error page
        ├── global-error.tsx     # Global error page
        └── not-found.tsx        # 404 page
```

## Consequences

### Positive
- Apps no longer crash on runtime errors
- Users see friendly Arabic error messages
- Structured logging enables easier debugging
- Consistent error handling across all apps
- Recovery mechanism (retry button) improves UX

### Negative
- ErrorBoundary only catches render errors, not:
  - Event handlers
  - Async code
  - Server-side rendering errors (Next.js handles separately)
- Additional complexity in app setup

### Neutral
- API errors still handled by React Query / component-level try-catch
- This PR focuses on unexpected runtime errors, not expected business errors

## Testing
1. **Mobile**: Throw error in any component → should show ErrorFallback
2. **Web**: Navigate to non-existent route → should show 404
3. **Web**: Throw error in dashboard → should show error page with retry
4. **All**: Check console for structured JSON logs

## Related
- PR#3: Error Boundaries & Global Error Handling
- Future: APM Integration (Sentry)
