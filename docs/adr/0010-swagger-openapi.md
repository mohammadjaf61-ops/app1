# ADR 0010: API Documentation with Swagger/OpenAPI

## Status
Accepted

## Date
2026-01-28

## Context
Frontend teams (mobile and web) need clear, up-to-date API documentation to integrate with the backend. Manual documentation quickly becomes outdated. We need:
- Auto-generated documentation from code
- Interactive API explorer for testing
- Consistent error response format
- Bilingual support (Arabic/English)

## Decision

### Swagger/OpenAPI Implementation

Using NestJS's built-in `@nestjs/swagger` module with enhanced configuration:

```typescript
// main.ts
const swaggerConfig = new DocumentBuilder()
  .setTitle('Hypermarket API')
  .setDescription('...')
  .setVersion('1.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
  .addTag('auth', 'Authentication - تسجيل الدخول')
  .addTag('products', 'Products - المنتجات')
  // ...
  .build();
```

### Documented Controllers (MVP Scope)

| Controller | Tag | Endpoints |
|------------|-----|-----------|
| AuthController | `auth` | login, otp/send, otp/verify, profile |
| ProductsController | `products` | CRUD + search by SKU/barcode |
| CategoriesController | `categories` | CRUD + tree structure |
| OrdersController | `orders` | CRUD + status updates + statistics |
| AdminController | `admin` | KPIs dashboard |

### Unified Error Codes

Created `@/common/errors/api-error-codes.ts` with standardized codes:

| Category | Code | HTTP | Arabic Message |
|----------|------|------|----------------|
| Auth | AUTH_UNAUTHORIZED | 401 | يجب تسجيل الدخول |
| Auth | AUTH_FORBIDDEN | 403 | غير مصرح لك بهذا الإجراء |
| Validation | VALIDATION_FAILED | 400 | بيانات غير صالحة |
| Resource | RESOURCE_NOT_FOUND | 404 | المورد غير موجود |
| Inventory | INVENTORY_OUT_OF_STOCK | 422 | المنتج غير متوفر |
| Order | ORDER_PRICE_CHANGED | 409 | تغير سعر المنتج |

### Error Response Format

```typescript
interface ApiErrorResponse {
  statusCode: number;      // HTTP status
  message: string;         // Arabic message
  errorCode: string;       // Unique code for client handling
  correlationId?: string;  // Request tracking ID
  timestamp: string;       // ISO timestamp
  details?: object;        // Additional context
}
```

### Documentation Decorators Used

- `@ApiTags()` - Group endpoints
- `@ApiOperation({ summary, description })` - Endpoint description
- `@ApiResponse({ status, description, schema })` - Response examples
- `@ApiParam()` / `@ApiQuery()` - Parameter documentation
- `@ApiBody({ examples })` - Request body examples
- `@ApiBearerAuth('JWT-auth')` - Auth requirement

## Alternatives Considered

### 1. Manual API Documentation (Notion/Confluence)
Rejected - quickly becomes outdated, no testing capability.

### 2. Postman Collections
Considered as supplement, but Swagger provides auto-generation from code.

### 3. GraphQL
Rejected for MVP - REST is simpler and team has more experience.

## Consequences

### Positive
- Self-documenting API from code
- Interactive testing via Swagger UI
- Consistent error handling across all endpoints
- Bilingual descriptions (Arabic + English)
- Request/response examples for quick integration

### Negative
- Decorators add code verbosity
- Swagger UI disabled in production (security)
- Limited to documented controllers only

## Access

**Swagger UI:** `http://localhost:3000/docs`

Features:
- `persistAuthorization: true` - Token saved across refreshes
- `filter: true` - Search endpoints
- `showRequestDuration: true` - Performance insight

## Security

- Swagger UI only available when `NODE_ENV !== 'production'`
- Bearer token required for protected endpoints
- Correlation ID in all error responses for debugging

## Future Improvements

1. Add OpenAPI export endpoint for client SDK generation
2. Integrate with Zod schemas from `@hypermarket/contracts`
3. Add rate limiting documentation
4. Generate TypeScript types from OpenAPI spec
