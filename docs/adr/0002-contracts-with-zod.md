# ADR-0002: Type-Safe API Contracts with Zod Schemas

## Status
Accepted

## Date
2026-01-28

## Context
The Hypermarket platform's frontend applications (admin-web, customer-app, driver-app, picker-app) and backend (NestJS API) had inconsistent type definitions:

- Frontend apps defined local interfaces that could drift from backend DTOs
- API responses were typed with `any` in several places
- No runtime validation of API responses
- Duplicated type definitions across packages

Specific issues found:
- `(productsData as any)?.data` patterns in screens
- `Record<string, unknown>` used for API filters without proper typing
- Manual type assertions hiding potential runtime errors
- No shared contract between frontend and backend

## Decision
Create a new workspace package `@hypermarket/contracts` with Zod schemas that:

1. Define shared API contracts as Zod schemas
2. Export both schemas (for runtime validation) and TypeScript types (for compile-time safety)
3. Update API clients to support typed requests with schema validation

### Package Structure
```
packages/contracts/
├── src/
│   ├── common.ts    # BaseEntity, Pagination, ApiError
│   ├── auth.ts      # Login, OTP, User schemas
│   ├── product.ts   # Product, ProductListResponse
│   ├── category.ts  # Category, CategoryTree
│   ├── order.ts     # Order, CreateOrderRequest/Response
│   └── index.ts     # Barrel exports
├── package.json
└── tsconfig.json
```

### API Client Enhancement
API clients in `mobile-core` and `admin-web` now support typed requests:

```typescript
// Standard request (existing behavior)
const products = await apiClient.get<Product[]>('/products');

// Typed request with schema validation
const products = await apiClient.getTyped('/products', ProductListResponseSchema);
// Returns: ProductListResponse (validated at runtime)
```

### Schemas Defined (MVP)
- **Common**: `BaseEntitySchema`, `PaginationMetaSchema`, `ApiErrorSchema`, `ApiExceptionSchema`
- **Auth**: `LoginRequestSchema`, `LoginResponseSchema`, `OtpRequestSchema`, `UserProfileSchema`
- **Product**: `ProductSchema`, `ProductListResponseSchema`, `CreateProductRequestSchema`
- **Category**: `CategorySchema`, `CategoryTreeSchema`, `CategoryListResponseSchema`
- **Order**: `OrderSchema`, `CreateOrderRequestSchema`, `OrderListResponseSchema`

## Consequences

### Positive
- Single source of truth for API contracts
- Runtime validation catches API contract violations early
- TypeScript types inferred from schemas (DRY)
- Removes `as any` type assertions from consumer code
- Consistent error handling across apps
- Self-documenting API contracts

### Negative
- Additional dependency (Zod) in contracts package
- Slight runtime overhead for schema validation
- Need to keep schemas in sync with backend DTOs

### Neutral
- Validation is optional (can use untyped methods for gradual migration)
- Backend validation remains independent (class-validator)

## Migration Guidelines

### Adding New Endpoints
1. Define request/response schemas in `packages/contracts`
2. Export from `index.ts`
3. Use `apiClient.getTyped()` or similar in consumers

### Updating Existing Endpoints
1. Check if schema exists in contracts
2. If yes, use typed methods
3. If no, either add schema or use standard methods

### Extending Schemas
```typescript
// In packages/contracts/src/product.ts
export const MyExtendedProductSchema = ProductSchema.extend({
  customField: z.string(),
});
```

## Testing
- Schemas can be tested independently with sample data
- API clients validate responses automatically
- Type errors caught at compile time

## Future Considerations
1. Generate OpenAPI spec from Zod schemas
2. Add request validation in backend using same schemas
3. Expand schemas to cover all API endpoints
4. Add JSON Schema export for API documentation

## Related
- PR#2: Type Safety Contracts
- ADR-0001: Extract Shared Mobile Packages
