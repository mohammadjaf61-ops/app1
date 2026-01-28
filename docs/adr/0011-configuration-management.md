# ADR 0011: Configuration Management + Feature Flags

## Status
Accepted

## Date
2026-01-28

## Context
Hardcoded values (delivery fees, algorithm thresholds, feature toggles) were scattered across the codebase, making configuration changes difficult and error-prone. We need:
- Centralized configuration management
- Database-backed settings with fast access
- Feature flags to enable/disable analytics features
- Type-safe settings access with defaults

## Decision

### SettingsModule Architecture

Created a global `SettingsModule` that provides:

```typescript
// Centralized setting keys with defaults
export const SETTINGS_KEYS = {
  // Order & Delivery
  DELIVERY_FEE_IQD: 'delivery_fee_iqd',      // 5000
  MIN_ORDER_AMOUNT_IQD: 'min_order_amount_iqd', // 10000

  // Analytics - Demand Forecasting
  FORECAST_DAYS: 'forecast_days',            // 14
  FORECAST_WINDOW_SIZE: 'forecast_window_size', // 7

  // Analytics - Anomaly Detection
  ANOMALY_Z_THRESHOLD: 'anomaly_z_threshold', // 2.5

  // Analytics - Basket Analysis
  BASKET_PERIOD_DAYS: 'basket_period_days',  // 30

  // Feature Flags
  ENABLE_DEMAND_FORECASTING: 'feature_demand_forecasting',
  ENABLE_BASKET_ANALYSIS: 'feature_basket_analysis',
  ENABLE_ANOMALY_DETECTION: 'feature_anomaly_detection',
};
```

### SettingsService

Type-safe service with memory caching:

```typescript
@Injectable()
export class SettingsService implements OnModuleInit {
  // Memory cache with 5-minute TTL
  private settingsCache: Map<string, unknown>;

  // Type-safe getters
  async getNumber(key: SettingKey): Promise<number>;
  async getBoolean(key: SettingKey): Promise<boolean>;
  async getString(key: SettingKey): Promise<string>;

  // Admin operations
  async set(key: SettingKey, value: unknown): Promise<void>;
  async getAll(): Promise<Record<string, unknown>>;
}
```

### FeatureFlagsService

Wrapper for feature flag checks:

```typescript
@Injectable()
export class FeatureFlagsService {
  async isEnabled(flag: FeatureFlagKey): Promise<boolean>;

  // Conditional execution
  async runIfEnabled<T>(flag: FeatureFlagKey, fn: () => Promise<T>): Promise<T | undefined>;
}
```

### Services Updated

| Service | Setting Used | Old Hardcoded Value |
|---------|-------------|---------------------|
| OrdersService | `delivery_fee_iqd` | 5000 |
| AnomalyDetectionService | `anomaly_z_threshold` | 2.5 |
| DemandForecastService | `forecast_days`, `forecast_window_size` | 14, 7 |
| BasketAnalysisService | `basket_period_days` | 30 |

### Data Flow

```
┌─────────────────┐
│  Prisma/DB      │  ← Setting table (key, value JSON, description)
└───────┬─────────┘
        │ on startup + every 5 min
        ▼
┌─────────────────┐
│ SettingsService │  ← Memory cache (Map<string, unknown>)
│   5-min TTL     │
└───────┬─────────┘
        │ type-safe getters
        ▼
┌─────────────────┐
│ Business Logic  │  ← OrdersService, AnalyticsServices, etc.
└─────────────────┘
```

## Alternatives Considered

### 1. Environment Variables Only
Rejected - requires redeployment for changes, no runtime updates.

### 2. Redis-Only Cache
Rejected - adds complexity, memory cache sufficient for settings.

### 3. External Config Service (Consul, etcd)
Rejected - overkill for MVP, database-backed is sufficient.

### 4. ConfigModule from NestJS
Used for static env vars, but not suitable for dynamic runtime settings.

## Consequences

### Positive
- No hardcoded magic numbers in business logic
- Runtime configuration changes without deployment
- Type-safe settings with intelligent defaults
- Feature flags for gradual rollouts
- Centralized configuration management
- Fast access via memory caching

### Negative
- Async access pattern (`await settingsService.get...`)
- Settings module must be initialized before dependent services
- Cache invalidation requires manual trigger or TTL wait

## Database Schema

Uses existing `Setting` model:

```prisma
model Setting {
  id          String   @id @default(uuid())
  key         String   @unique
  value       Json
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Usage Examples

```typescript
// In OrdersService
const deliveryFee = await this.settingsService.getNumber(SETTINGS_KEYS.DELIVERY_FEE_IQD);

// In AnomalyDetectionService
const zThreshold = await this.settingsService.getNumber(SETTINGS_KEYS.ANOMALY_Z_THRESHOLD);

// Feature flag check
if (await this.featureFlags.isEnabled(FEATURE_FLAGS.DEMAND_FORECASTING)) {
  await this.generateForecasts();
}
```

## Future Improvements

1. Add admin UI for settings management
2. Add audit logging for setting changes
3. Add Redis pub/sub for multi-instance cache invalidation
4. Add setting versioning for rollback
