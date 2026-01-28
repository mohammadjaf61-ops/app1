# ADR 0002: Type-Safe API Contracts with Zod

## Status
Accepted

## Context
The Hypermarket mobile applications (customer-app, driver-app, picker-app) were using `any` type assertions and untyped API responses, which led to:
- Runtime type errors that could have been caught at compile time
- Inconsistent data shapes across different parts of the application
- Difficult debugging when API responses didn't match expectations
- Poor developer experience with no IDE autocompletion for API data

## Decision
We created a shared `@hypermarket/contracts` package with Zod schemas that:
1. Define type-safe schemas for all API entities (Auth, Product, Category, Order)
2. Provide runtime validation with human-readable error messages
3. Export TypeScript types inferred from schemas
4. Can be used by both frontend and backend for consistent typing

### Package Structure
```
packages/contracts/
├── src/
│   ├── index.ts      # Barrel exports
│   ├── common.ts     # Shared schemas (Pagination, ApiError, IQD)
│   ├── auth.ts       # Auth schemas (Login, OTP, UserProfile)
│   ├── category.ts   # Category schemas
│   ├── product.ts    # Product schemas
│   └── order.ts      # Order schemas
└── package.json
```

### Key Schemas Defined
- **Common**: `IraqiPhoneSchema`, `PaginationQuerySchema`, `ApiErrorResponseSchema`, `IQDAmountSchema`
- **Auth**: `LoginRequestSchema`, `SendOtpRequestSchema`, `VerifyOtpRequestSchema`, `UserProfileSchema`
- **Product**: `ProductSchema`, `ProductSummarySchema`, `ProductQuerySchema`
- **Category**: `CategorySchema`, `CategoryWithChildrenSchema`
- **Order**: `OrderSchema`, `OrderSummarySchema`, `CreateOrderRequestSchema`

### API Client Updates
The `@hypermarket/mobile-core` api-client was enhanced with:
- `ApiException` class with proper error typing
- Typed methods (`getTyped`, `postTyped`, `putTyped`, `patchTyped`)
- Response validation using Zod schemas
- Better error handling with validation error details

## Consequences

### Positive
- Compile-time type checking catches errors before runtime
- IDE autocompletion works for API responses
- Single source of truth for API types shared across apps
- Runtime validation provides clear error messages
- Easier onboarding for new developers

### Negative
- Additional build step for contracts package
- Slightly larger bundle size due to Zod
- Schema definitions need maintenance when API changes

### Tradeoffs
- We kept local types in some screens where the contracts types were too detailed
- The contracts define complete API schemas but apps may use simplified versions
- Future work should align hook return types with contracts types

## Related Decisions
- ADR 0001: Mobile Shared Packages (introduces package structure)
- Future: Backend should use same contracts for request/response validation
