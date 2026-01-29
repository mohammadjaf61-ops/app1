# ADR 0031: External Integrations Readiness

## Status

Accepted

## Date

2026-01-29

## Context

The Hypermarket Platform needs to integrate with external services for:
- **SMS**: Customer order confirmations and status updates
- **Push Notifications**: Staff assignments (picker/driver)
- **Accounting Systems**: Transaction sync for financial reporting

These integrations must be:
1. Disabled by default (no external calls in v1.0)
2. Easy to enable without code changes
3. Swappable without refactoring
4. Logged for debugging

## Decision

Implement a pluggable integration architecture using:

### 1. Provider Interfaces

```typescript
interface SmsProvider {
  send(payload: SmsPayload): Promise<SmsResult>;
  getProviderName(): string;
}

interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationResult>;
  sendToTopic(topic: string, payload: NotificationPayload): Promise<NotificationResult>;
  getProviderName(): string;
}

interface AccountingAdapter {
  syncTransaction(entry: AccountingEntry): Promise<AccountingSyncResult>;
  getAdapterName(): string;
}
```

### 2. Noop Implementations

Default implementations that:
- Log all requests (for debugging)
- Return success immediately
- Make no external calls

### 3. Feature Flags

| Flag | Key | Default |
|------|-----|---------|
| SMS | `integration_sms_enabled` | `false` |
| Notifications | `integration_notifications_enabled` | `false` |
| Accounting | `integration_accounting_enabled` | `false` |

### 4. Dependency Injection

Providers are injected via NestJS DI tokens:
- `SMS_PROVIDER`
- `NOTIFICATION_PROVIDER`
- `ACCOUNTING_ADAPTER`

To switch providers, only the module configuration changes.

## Event Hooks

The `IntegrationsService` exposes high-level methods:

| Event | Method | Integrations Triggered |
|-------|--------|----------------------|
| Order created | `onOrderCreated()` | SMS confirmation |
| Status changed | `onOrderStatusChanged()` | SMS update, Push notification |
| Payment completed | `onPaymentCompleted()` | Accounting sync |

## Future Providers

When real integrations are needed:

```typescript
// Example: Twilio SMS
@Module({
  providers: [
    {
      provide: SMS_PROVIDER,
      useClass: TwilioSmsProvider, // Replace NoopSmsProvider
    },
  ],
})
```

## Consequences

### Positive
- No external dependencies in v1.0
- Easy to test (noop providers)
- Clear separation of concerns
- All integration attempts are logged
- Feature flags allow runtime control

### Negative
- Additional abstraction layer
- Need to implement real providers later

### Neutral
- Logging overhead (minimal)

## Alternatives Considered

1. **Direct API calls**: Rejected - too coupled, hard to test
2. **Event-driven (queues)**: Overkill for v1.0, consider for v2
3. **No integration prep**: Rejected - would require refactoring later

## References

- PR#31: External Integrations Readiness
- `services/api/src/modules/integrations/`
