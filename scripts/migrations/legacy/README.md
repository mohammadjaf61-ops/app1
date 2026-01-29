# Legacy Data Migration Tools

Tools for migrating data from legacy systems to the Hypermarket Platform.

## Quick Start

```bash
# Navigate to script directory
cd scripts/migrations/legacy

# Run with dry-run first
npx ts-node import-categories.ts ../data/categories.json --dry-run
npx ts-node import-products.ts ../data/products.json --dry-run
npx ts-node import-inventory.ts ../data/inventory.json --dry-run

# If dry-run looks good, run for real
npx ts-node import-categories.ts ../data/categories.json
npx ts-node import-products.ts ../data/products.json
npx ts-node import-inventory.ts ../data/inventory.json

# Validate
npx ts-node validate-migration.ts
```

## Scripts

| Script | Purpose | Natural Key |
|--------|---------|-------------|
| `import-categories.ts` | Import product categories | `nameAr` |
| `import-products.ts` | Import products | `sku` |
| `import-inventory.ts` | Import stock levels | `sku + location` |
| `import-customers.ts` | Import customer data | `phone` |
| `validate-migration.ts` | Post-migration checks | N/A |

## Options

All import scripts support:

- `--dry-run` - Preview changes without writing to database
- `--verbose` - Show detailed progress
- `--quiet` - Minimal output
- `--batch=N` - Process N records at a time (default: 100)

## Input Formats

### JSON
```json
[
  { "sku": "PRD001", "nameAr": "تفاح أحمر", "category": "فواكه", "price": 2500 },
  { "sku": "PRD002", "nameAr": "موز", "category": "فواكه", "price": 1500 }
]
```

### CSV
```csv
sku,nameAr,category,price
PRD001,تفاح أحمر,فواكه,2500
PRD002,موز,فواكه,1500
```

## Idempotency

All scripts use `upsert` logic:
- If record exists (by natural key): **Update**
- If record doesn't exist: **Create**

This means you can safely re-run scripts.

## Order of Execution

1. Categories (required for products)
2. Products (required for inventory)
3. Inventory
4. Customers (optional)
5. Validation

## See Also

- `docs/MIGRATION_MAPPING.md` - Field mapping reference
- `docs/CUTOVER_PLAN.md` - Go-live transition plan
- `docs/adr/0032-data-migration.md` - Architecture decision
