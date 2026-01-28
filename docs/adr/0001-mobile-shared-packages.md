# ADR-0001: Extract Shared Mobile Packages

## Status
Accepted

## Date
2026-01-28

## Context
The Hypermarket platform has three React Native mobile applications (customer-app, driver-app, picker-app) that share significant amounts of duplicated code:

- UI Components: Button, Badge, Input
- Layout Components: ScreenWrapper
- Core Utilities: formatters (currency, date, time)
- API Client: Base HTTP client with token management

This duplication leads to:
- Inconsistent implementations across apps
- Higher maintenance burden
- Harder to ensure uniform UX/UI
- Repeated bug fixes across multiple files

## Decision
Extract shared code into two workspace packages:

### @hypermarket/mobile-ui
- Shared UI components (Button, Badge, Input)
- Components use NativeWind for styling (className prop)
- Type-safe with full TypeScript support
- Peer dependencies on react, react-native, nativewind

### @hypermarket/mobile-core
- ScreenWrapper layout component
- BaseApiClient for HTTP requests with token management
- Formatters for currency (IQD), dates, times
- Peer dependencies on expo-secure-store, react-native-safe-area-context

### Architecture
```
packages/
├── mobile-ui/
│   └── src/
│       ├── components/
│       │   ├── Button.tsx
│       │   ├── Badge.tsx
│       │   └── Input.tsx
│       └── index.ts
└── mobile-core/
    └── src/
        ├── api/
        │   └── api-client.ts
        ├── layout/
        │   └── ScreenWrapper.tsx
        ├── utils/
        │   └── formatters.ts
        └── index.ts
```

### Import Pattern
Apps import from packages using barrel re-exports:

```typescript
// In apps/customer-app/src/components/ui/index.ts
export { Button, Badge, Input } from '@hypermarket/mobile-ui';
export { ProductCard } from './ProductCard'; // app-specific

// In apps/customer-app/src/components/layout/ScreenWrapper.tsx
export { ScreenWrapper } from '@hypermarket/mobile-core';
```

This pattern allows:
- Gradual migration without changing all imports at once
- App-specific components to coexist with shared ones
- Clear separation between shared and app-specific code

## Consequences

### Positive
- Single source of truth for shared components
- Consistent UI/UX across all mobile apps
- Easier maintenance and bug fixes
- Better code reusability
- Type safety preserved

### Negative
- Slightly more complex build setup (Metro config for monorepo)
- Need to coordinate changes across apps when modifying shared packages
- Initial migration effort

### Neutral
- Apps still manage their own app-specific components
- auth-store remains app-specific (different auth flows per role)
- api-client endpoints remain app-specific (extended from BaseApiClient)

## Migration Notes
- Deleted duplicate files: Button.tsx, Badge.tsx, Input.tsx from all three apps
- ScreenWrapper.tsx now re-exports from shared package
- formatters.ts now re-exports from shared package
- Metro config added to support workspace packages

## Related
- PR#1: Extract Shared Mobile Packages
