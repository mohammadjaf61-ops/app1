# ADR 0013: i18n Foundations (Arabic-first, Extensible)

## Status
Accepted

## Date
2026-01-28

## Context
The codebase had hardcoded Arabic strings scattered across:
- Customer mobile app (React Native)
- Admin web dashboard (Next.js)
- Backend validation messages (NestJS)

This made it difficult to:
- Maintain consistent terminology
- Support additional languages in the future
- Reuse translation strings across apps
- Test with different locales

## Decision

### Shared i18n Package

Created `packages/i18n` as the central translation hub:

```
packages/i18n/
├── src/
│   ├── locales/
│   │   ├── ar.json      # Primary (Arabic)
│   │   └── en.json      # Placeholder structure
│   ├── types.ts         # TypeScript types
│   ├── utils.ts         # Helpers (interpolate, format)
│   └── index.ts         # Exports
├── package.json
└── tsconfig.json
```

### Translation Structure

Organized by namespace (domain) for maintainability:

```json
{
  "common": { "loading": "...", "save": "..." },
  "navigation": { "home": "...", "cart": "..." },
  "auth": { "login": "...", "logout": "..." },
  "products": { "title": "...", "price": "..." },
  "cart": { "emptyCart": "...", "checkout": "..." },
  "orders": { "status": { "pending": "...", "delivered": "..." } },
  "errors": { "network": "...", "notFound": "..." },
  "validation": { "skuRequired": "...", "pricePositive": "..." }
}
```

### i18next Integration

Both apps use i18next for React integration:

```typescript
// Initialize (one-time)
import '@/lib/i18n';

// Use in components
const { t } = useT();
return <Text>{t('cart.emptyCart')}</Text>;
```

### useT Hook

Custom hook provides type-safe access:

```typescript
export function useT() {
  const { t, i18n } = useTranslation();

  return {
    t: (key: string, params?: InterpolationParams) => t(key, params),
    locale: i18n.language as Locale,
    direction: getLocaleDirection(i18n.language),
    isRTL: i18n.language === 'ar',
    changeLanguage: (locale: Locale) => i18n.changeLanguage(locale),
    locales: LOCALES,
  };
}
```

### Interpolation

Support for dynamic values:

```json
{ "itemsCount": "{{count}} عنصر" }
```

```typescript
t('cart.itemsCount', { count: 5 }) // "5 عنصر"
```

### Backend Error Codes

Validation messages use codes instead of Arabic text:

```typescript
// Before
@IsNotEmpty({ message: 'رمز المنتج مطلوب' })

// After
@IsNotEmpty({ message: 'validation.skuRequired' })
```

Frontend translates: `t(error.message)` → "رمز المنتج مطلوب"

### RTL Support

Automatic RTL configuration:

```typescript
// React Native
I18nManager.forceRTL(locale === 'ar');

// Next.js
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
```

## Files Created/Modified

### New Package
- `packages/i18n/` - Shared translations and utilities

### Customer App (React Native)
- `apps/customer-app/src/lib/i18n.ts` - i18next setup
- `apps/customer-app/src/hooks/use-t.ts` - Translation hook
- `apps/customer-app/App.tsx` - Import i18n
- `apps/customer-app/src/navigation/MainNavigator.tsx` - Use translations
- `apps/customer-app/src/screens/CartScreen.tsx` - Use translations

### Admin Web (Next.js)
- `apps/admin-web/src/lib/i18n.ts` - i18next setup
- `apps/admin-web/src/hooks/use-t.ts` - Translation hook
- `apps/admin-web/src/components/providers.tsx` - Import i18n
- `apps/admin-web/src/components/layout/dashboard-layout.tsx` - Use translations

### Backend
- `services/api/src/modules/products/dto/create-product.dto.ts` - Error codes

## Translation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Add string to packages/i18n/src/locales/ar.json         │
│    { "products": { "newFeature": "ميزة جديدة" } }          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Add placeholder to en.json (same key)                    │
│    { "products": { "newFeature": "New Feature" } }         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Rebuild package: pnpm --filter @hypermarket/i18n build  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Use in components: t('products.newFeature')             │
└─────────────────────────────────────────────────────────────┘
```

## Alternatives Considered

### 1. Per-app Translation Files
Rejected - duplication and inconsistency issues.

### 2. react-intl
Considered but i18next is more flexible and better supported in React Native.

### 3. Built-in Next.js i18n
Only works for Next.js, not React Native.

## Consequences

### Positive
- Single source of truth for translations
- Type-safe translation keys (TypeScript)
- Easy to add new languages
- Consistent terminology across apps
- Backend errors are translatable
- RTL handled automatically

### Negative
- Requires package rebuild when adding strings
- Slightly more setup overhead
- Missing keys show key path (not critical for Arabic-first)

## Adding a New Language

1. Create `packages/i18n/src/locales/fr.json`
2. Add to `LOCALES` in `types.ts`
3. Import in `index.ts`
4. Add resources in app i18n setup

## Future Improvements

1. Add language switcher UI
2. Extract remaining hardcoded strings
3. Add pluralization rules
4. Add date/number formatting per locale
5. Consider translation management tool (Crowdin, Lokalise)
