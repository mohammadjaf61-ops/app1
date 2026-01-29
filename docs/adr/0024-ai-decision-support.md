# ADR 0024: AI Repositioning - From Over-Engineering to Decision Support

## Status

Accepted

## Context

The platform had complex AI features (demand forecasting, basket analysis) that were:
- Running but not operationally utilized
- Adding complexity without providing clear value
- Potentially "over-engineering" for current needs

The goal was to reposition AI from being a premature optimization to becoming a **read-only, explainable decision support layer** that serves management without affecting operations.

### Key Principle: AI Explains, Not Decides

| Constraint | Reason |
|-----------|--------|
| AI does NOT change decisions automatically | Humans remain in control |
| AI does NOT affect orders or inventory | No operational side effects |
| AI explains, does not decide | Transparency and trust |
| Every insight is explainable | Management can understand "why" |
| Can be disabled via feature flag | Risk mitigation |

## Decision

### 1. Disabled Complex AI Features (Default OFF)

The following features are now **disabled by default** in `settings.service.ts`:

```typescript
// Feature Flags - Complex AI features disabled by default (PR#24)
[SETTINGS_KEYS.ENABLE_DEMAND_FORECASTING]: false,
[SETTINGS_KEYS.ENABLE_BASKET_ANALYSIS]: false,
// Anomaly detection kept for operational alerts
[SETTINGS_KEYS.ENABLE_ANOMALY_DETECTION]: true,
// AI Insights: read-only, explainable decision support (PR#24)
[SETTINGS_KEYS.ENABLE_AI_INSIGHTS]: true,
```

### 2. AI Insights Service

New service providing read-only, explainable insights:

```typescript
@Injectable()
export class AiInsightsService {
  async getAllInsights(): Promise<Insight[]> {
    // Only runs if feature flag is enabled
    if (!await this.featureFlags.isEnabled(FEATURE_FLAGS.AI_INSIGHTS)) {
      return [];
    }

    // Generate explainable insights
    return [
      await this.getStagnantProductsInsight(),
      await this.getPeakHoursInsight(),
      await this.getCancellationRateInsight(),
    ].filter(Boolean);
  }
}
```

### 3. Insight Types

| Insight | What It Shows | Why It Matters |
|---------|--------------|----------------|
| **Stagnant Products** | Products with no sales in 30 days | Review pricing/visibility |
| **Peak Hours** | Busiest order hours | Staffing optimization |
| **High Cancellation** | Cancellation rate > 5% | Customer experience issues |

### 4. Explainable Format

Every insight includes:

```typescript
interface InsightExplanation {
  reason: string;        // Why this insight matters
  reasonAr: string;      // Arabic explanation
  dataSource: string;    // What data was used
  periodDays: number;    // Analysis period
  methodology: string;   // How it was calculated
}
```

Example output:
```json
{
  "type": "STAGNANT_PRODUCTS",
  "titleAr": "15 منتج راكد",
  "summaryAr": "15 منتج لم يُباع خلال آخر 30 يوم",
  "explanation": {
    "reasonAr": "هذه المنتجات ليس لها مبيعات مسجلة في فترة التحليل...",
    "dataSource": "Orders and Products tables",
    "periodDays": 30,
    "methodology": "Products grouped by last sale date..."
  },
  "severity": "warning"
}
```

### 5. Admin UI

New **Insights page** (`/dashboard/insights`):

- Shows all insights as cards
- Each card has expandable "لماذا؟" (Why?) section
- Severity badges: info (blue), warning (amber), critical (red)
- Clear notice: "للمعلومات فقط - AI يُفسّر ولا يُقرر"
- Disabled state shows message if feature is off

### 6. Feature Flag Control

```typescript
export const FEATURE_FLAGS = {
  DEMAND_FORECASTING: 'feature_demand_forecasting',  // OFF by default
  BASKET_ANALYSIS: 'feature_basket_analysis',         // OFF by default
  ANOMALY_DETECTION: 'feature_anomaly_detection',     // ON for alerts
  AI_INSIGHTS: 'feature_ai_insights',                 // ON for decision support
};
```

### 7. Audit Trail

All AI insights are logged via `AiGovernanceService`:

```typescript
await this.governance.logOutput({
  outputType: 'INSIGHTS',
  modelName: 'ai_insights_v1',
  inputParams: { periodDays: 30 },
  outputData: { insightCount: 3, types: ['STAGNANT_PRODUCTS', ...] },
});
```

## Implementation Files

### New Files

| File | Purpose |
|------|---------|
| `services/api/src/modules/analytics/services/ai-insights.service.ts` | Insights generation service |
| `apps/admin-web/src/app/dashboard/insights/page.tsx` | Admin insights page |

### Modified Files

| File | Changes |
|------|---------|
| `services/api/src/modules/settings/settings.service.ts` | Added AI_INSIGHTS flag, disabled complex AI defaults |
| `services/api/src/modules/settings/feature-flags.service.ts` | Added AI_INSIGHTS flag |
| `services/api/src/modules/analytics/analytics.module.ts` | Added AiInsightsService |
| `services/api/src/modules/analytics/analytics.controller.ts` | Added insights endpoints |
| `apps/admin-web/src/hooks/use-api.ts` | Added useInsights, useInsightsStatus hooks |
| `apps/admin-web/src/components/layout/dashboard-layout.tsx` | Added insights nav link |
| `packages/i18n/src/locales/ar.json` | Added insights translations |

## Consequences

### What Was Disabled

| Feature | Previous State | New State | Reason |
|---------|---------------|-----------|--------|
| Demand Forecasting | ON | **OFF** | Complex, not operationally used |
| Basket Analysis | ON | **OFF** | Complex, not operationally used |
| Anomaly Detection | ON | ON | Simple, provides value |
| AI Insights | N/A | **NEW** | Simple, explainable, valuable |

### Positive

1. **No operational risk** - AI cannot affect orders, inventory, or decisions
2. **Explainable** - Every insight has clear "why" in Arabic
3. **Controllable** - Can be disabled with single feature flag
4. **Auditable** - All outputs logged
5. **Simple** - No ML models, just SQL aggregations

### Negative

1. **Less "smart"** - No predictive capabilities (intentionally)
2. **Manual action required** - Insights don't trigger automatic responses

### Example Insights Output

**Stagnant Products:**
- 15 منتج راكد
- لماذا؟ هذه المنتجات ليس لها مبيعات مسجلة في فترة التحليل

**Peak Hours:**
- معظم الطلبات تأتي في الساعة 14:00 (23% من الطلبات)
- لماذا؟ فهم ساعات الذروة يساعد في تحسين تخصيص الموظفين

**High Cancellation:**
- نسبة إلغاء 12%
- لماذا؟ نسب الإلغاء المرتفعة قد تشير إلى مشاكل في توفر المنتجات

## Related

- ADR 0023: Staff Apps Completion
- ADR 0021: Data Integrity, Constraints & Auditing
- `services/api/src/modules/analytics/` - Analytics module
