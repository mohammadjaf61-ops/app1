# ADR 0032: Data Migration & Cutover Strategy

## Status

Accepted

## Date

2026-01-29

## Context

The Hypermarket Platform must support migration from legacy systems with:
- **Categories**: Product categorization hierarchy
- **Products**: Full product catalog with prices and metadata
- **Inventory**: Stock levels across locations
- **Customers**: Customer data and contact information

Migration requirements:
1. Zero data loss during transition
2. Idempotent scripts (safe to re-run)
3. Dry-run capability for validation
4. Clear rollback procedure
5. Minimal downtime (target: <8 hours)

## Decision

Implement a TypeScript-based migration toolkit with the following architecture:

### 1. Natural Key Strategy

Each entity uses a natural key for idempotent upserts:

| Entity | Natural Key | Rationale |
|--------|-------------|-----------|
| Category | `nameAr` | Arabic names are unique per business |
| Product | `sku` | SKU is universal product identifier |
| Inventory | `sku + location` | Composite uniqueness per location |
| Customer | `phone` | Phone is primary customer identifier |

### 2. Script Architecture

```
scripts/migrations/legacy/
├── config.ts           # Shared utilities and types
├── import-categories.ts  # Category import (run first)
├── import-products.ts    # Product import (needs categories)
├── import-inventory.ts   # Inventory import (needs products)
├── import-customers.ts   # Customer import (independent)
├── validate-migration.ts # Post-import validation
└── README.md            # Usage documentation
```

### 3. Upsert Logic

All scripts use Prisma's `upsert` for idempotency:

```typescript
await prisma.product.upsert({
  where: { sku: record.sku },
  update: { ...productData },
  create: { ...productData },
});
```

### 4. Execution Modes

| Flag | Behavior |
|------|----------|
| `--dry-run` | Parse and validate only, no DB writes |
| `--verbose` | Detailed progress logging |
| `--quiet` | Minimal output (errors only) |
| `--batch=N` | Process N records per transaction |

### 5. Error Handling

Non-blocking errors (skip record, continue):
- Invalid data format
- Missing optional fields
- Validation failures

Blocking errors (stop execution):
- Database connection failure
- Schema mismatch
- Unrecoverable state

### 6. Validation Suite

Post-migration checks:

| Check | Validation |
|-------|------------|
| V001 | Categories exist and have names |
| V002 | Products have valid categories |
| V003 | Products have valid prices (>0) |
| V004 | Inventory references valid products |
| V005 | Inventory quantities are non-negative |
| V006 | No orphan records |
| V007 | No duplicate natural keys |
| V008 | Data counts match source |
| V009 | Sample records spot-check |
| V010 | Referential integrity |

## Cutover Process

### Phase Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| 1. Prep | 30 min | Maintenance mode, backup |
| 2. Export | 30 min | Extract from legacy |
| 3. Import | 2 hours | Run migration scripts |
| 4. Validate | 1 hour | Automated + manual checks |
| 5. Activate | 1 hour | Enable platform, smoke test |
| 6. Monitor | 3 hours | Watch for issues |

### Rollback Triggers

Initiate rollback if:
- Data validation fails (>1% discrepancy)
- Critical API errors (>5% failure rate)
- Unable to complete checkout flow
- Stakeholder decision

### Rollback Procedure

1. Enable maintenance mode
2. Stop platform services
3. Restore pre-import database backup
4. Re-enable legacy system
5. Post-mortem and reschedule

## Consequences

### Positive
- Idempotent scripts enable safe re-runs
- Dry-run prevents production mistakes
- Natural keys eliminate ID mapping complexity
- Clear validation suite catches issues early
- Documented rollback reduces risk

### Negative
- TypeScript scripts require Node.js runtime
- Natural key assumption may not fit all cases
- Sequential execution order required

### Neutral
- Batch processing trades speed for reliability
- Verbose logging aids debugging but increases output

## Alternatives Considered

1. **Database-level replication**: Rejected - schema differences too large
2. **ETL tool (Talend, etc.)**: Overkill for one-time migration
3. **Direct SQL scripts**: Less portable, harder to validate
4. **Streaming migration**: Unnecessary complexity for data volume

## Input Formats

Scripts support:
- **JSON**: Array of objects
- **CSV**: Header row with UTF-8 encoding

## Field Mapping

See `docs/MIGRATION_MAPPING.md` for complete field-by-field mapping.

## References

- PR#32: Data Migration & Cutover Strategy
- `scripts/migrations/legacy/README.md`
- `docs/MIGRATION_MAPPING.md`
- `docs/CUTOVER_PLAN.md`
