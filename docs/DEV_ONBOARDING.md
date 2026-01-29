# Developer Onboarding Guide

Welcome to the Hypermarket Platform. This guide will help you understand the codebase and get productive within 2 days.

## Day 1: Setup & Architecture

### Hour 1-2: Environment Setup

#### Prerequisites

```bash
# Required versions
node --version  # Should be 20.x
pnpm --version  # Should be 9.x
docker --version # Should be 24+
```

#### Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd hypermarket-platform

# 2. Install dependencies
pnpm install

# 3. Start infrastructure
docker-compose up -d

# 4. Setup API environment
cp services/api/.env.example services/api/.env

# 5. Generate Prisma client
pnpm db:generate

# 6. Run migrations
pnpm db:migrate

# 7. Start API (terminal 1)
pnpm api:dev

# 8. Start Admin Web (terminal 2)
pnpm admin:dev
```

Verify setup:
- API: http://localhost:3000/api/health
- Admin: http://localhost:3001

### Hour 2-4: Understand the Architecture

#### Monorepo Structure

```
/home/user/app1/
├── apps/                    # Frontend applications
│   ├── admin-web/           # Next.js admin dashboard
│   ├── customer-mobile/     # Expo customer app
│   ├── picker-mobile/       # React Native picker app
│   ├── driver-mobile/       # React Native driver app
│   └── cashier-web/         # Next.js POS
│
├── services/
│   └── api/                 # NestJS backend
│       ├── src/
│       │   ├── modules/     # Feature modules
│       │   ├── common/      # Shared utilities
│       │   └── prisma/      # Database layer
│       └── prisma/
│           └── schema.prisma
│
├── packages/                # Shared packages
│   ├── shared-types/        # TypeScript types
│   ├── shared-utils/        # Utility functions
│   └── i18n/                # Translations
│
└── docs/                    # Documentation
    └── adr/                 # Architecture Decision Records
```

#### Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| API | NestJS | Backend framework |
| Database | PostgreSQL + Prisma | Data persistence |
| Cache/Queue | Redis + Bull | Caching, job queues |
| Admin Web | Next.js 14 | Admin dashboard |
| Mobile | Expo / React Native | Customer & staff apps |
| Styling | Tailwind CSS + shadcn/ui | UI components |

### Hour 4-6: Explore the Codebase

#### Essential Files to Read

1. **`services/api/prisma/schema.prisma`** - Database schema
2. **`services/api/src/app.module.ts`** - API module structure
3. **`apps/admin-web/src/app/layout.tsx`** - Admin app structure
4. **`docs/SYSTEM_OVERVIEW.md`** - System capabilities
5. **`docs/adr/`** - Architecture decisions

#### API Module Pattern

Each feature follows this structure:

```
modules/orders/
├── orders.module.ts      # Module definition
├── orders.controller.ts  # HTTP endpoints
├── orders.service.ts     # Business logic
├── dto/                  # Request/response types
│   ├── create-order.dto.ts
│   └── update-order.dto.ts
└── entities/             # Domain entities
```

#### Request Flow

```
HTTP Request
    ↓
Controller (validate input)
    ↓
Service (business logic)
    ↓
Prisma (database)
    ↓
Response
```

### Hour 6-8: Key Concepts

#### Order Flow

```
PENDING → PICKING → READY → OUT_FOR_DELIVERY → DELIVERED
```

Understanding order states is critical. Explore:
- `services/api/src/modules/orders/orders.service.ts`
- `services/api/src/modules/orders/enums/order-status.enum.ts`

#### Authentication

JWT-based authentication with refresh tokens:
- `services/api/src/modules/auth/`
- Access token: 15 minutes
- Refresh token: 7 days

#### Observability

All requests are traced with `requestId`:
- `services/api/src/common/observability/`
- Look for `StructuredLogger` usage

---

## Day 2: Hands-On & Contributing

### Hour 1-2: Run and Test

#### Run All Tests

```bash
# API tests
pnpm api:test

# Admin web tests (if available)
pnpm --filter admin-web test
```

#### Run Specific Test

```bash
# Test a specific module
pnpm --filter @hypermarket/api test -- --testPathPattern=orders
```

#### Debug with Prisma Studio

```bash
pnpm db:studio
# Opens browser at localhost:5555
```

### Hour 2-4: Make a Small Change

#### Practice Exercise: Add a Field to an API

1. **Update Prisma schema**
   ```prisma
   // services/api/prisma/schema.prisma
   model Product {
     // ... existing fields
     notes String? // Add this
   }
   ```

2. **Generate migration**
   ```bash
   pnpm --filter @hypermarket/api prisma migrate dev --name add_product_notes
   ```

3. **Update DTO**
   ```typescript
   // services/api/src/modules/products/dto/update-product.dto.ts
   @IsOptional()
   @IsString()
   notes?: string;
   ```

4. **Update service if needed**
   ```typescript
   // services/api/src/modules/products/products.service.ts
   // Usually Prisma handles it automatically
   ```

5. **Test the change**
   ```bash
   curl -X PATCH http://localhost:3000/api/products/1 \
     -H "Content-Type: application/json" \
     -d '{"notes": "Test note"}'
   ```

### Hour 4-6: Understand Patterns

#### DTO Validation

```typescript
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  nameAr: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsNumber()
  price: number;
}
```

#### Service Pattern

```typescript
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
    });
  }

  async findAll(query: ListQueryDto) {
    return this.prisma.product.findMany({
      where: { isActive: true },
      take: query.limit,
      skip: query.offset,
    });
  }
}
```

#### Frontend Data Fetching

```typescript
// apps/admin-web/src/hooks/use-api.ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.get('/products'),
  });
}
```

### Hour 6-8: Code Quality & Contributing

#### Before Committing

```bash
# Format code
pnpm format

# Lint
pnpm lint

# Type check
pnpm type-check

# Run tests
pnpm test
```

#### Commit Message Format

```
type(scope): description

Examples:
feat(orders): add cancellation reason field
fix(inventory): correct stock calculation
docs(readme): update setup instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

#### Pull Request Checklist

- [ ] Code follows existing patterns
- [ ] Tests added/updated
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Documentation updated if needed
- [ ] ADR created for significant changes

---

## Key Files Reference

### Backend (API)

| File | Purpose |
|------|---------|
| `services/api/src/main.ts` | Application entry point |
| `services/api/src/app.module.ts` | Root module |
| `services/api/prisma/schema.prisma` | Database schema |
| `services/api/src/common/observability/` | Logging & tracing |
| `services/api/src/modules/auth/` | Authentication |
| `services/api/src/modules/orders/` | Order management |

### Frontend (Admin Web)

| File | Purpose |
|------|---------|
| `apps/admin-web/src/app/layout.tsx` | Root layout |
| `apps/admin-web/src/app/dashboard/` | Dashboard pages |
| `apps/admin-web/src/hooks/use-api.ts` | API hooks |
| `apps/admin-web/src/components/ui/` | UI components |

### Shared

| File | Purpose |
|------|---------|
| `packages/shared-types/` | Shared TypeScript types |
| `packages/i18n/src/locales/ar.json` | Arabic translations |

---

## Common Commands

```bash
# Development
pnpm api:dev          # Start API
pnpm admin:dev        # Start admin web
pnpm customer:dev     # Start customer mobile

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio

# Quality
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix lint issues
pnpm format           # Format code
pnpm type-check       # TypeScript check
pnpm test             # Run tests

# Build
pnpm build            # Build all packages
pnpm api:build        # Build API only
pnpm admin:build      # Build admin web only
```

---

## Getting Help

### Documentation

1. `docs/SYSTEM_OVERVIEW.md` - What the system does
2. `docs/adr/` - Why decisions were made
3. `docs/DEPLOYMENT_GUIDE.md` - Deployment procedures

### Code Questions

1. Search codebase for similar patterns
2. Check ADRs for context
3. Ask team lead

### ADR Reading Priority

1. ADR 0021 - Data Integrity
2. ADR 0022 - Customer Experience
3. ADR 0023 - Staff Apps
4. ADR 0024 - AI Decision Support

---

## Tips for Success

1. **Follow existing patterns** - Don't reinvent; replicate what exists
2. **Read before writing** - Understand context before coding
3. **Small commits** - Easier to review and revert
4. **Test locally** - Don't rely on CI alone
5. **Ask early** - When stuck, ask sooner rather than later
6. **Document decisions** - Create ADRs for significant changes

Welcome to the team! 🎉
