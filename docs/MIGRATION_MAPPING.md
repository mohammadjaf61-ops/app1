# Data Migration Field Mapping Reference

This document maps legacy system fields to the Hypermarket Platform schema.

## Categories (الأقسام)

| Legacy Field | Platform Field | Type | Transform | Notes |
|--------------|----------------|------|-----------|-------|
| `category_id` | - | int | Ignored | Auto-generated UUID used instead |
| `name_ar` | `nameAr` | string | Direct | Required, used as natural key |
| `name_en` | `nameEn` | string | Direct | Optional |
| `parent_id` | `parentId` | int→UUID | Lookup | Resolved via nameAr lookup |
| `sort_order` | `sortOrder` | int | Direct | Default: 0 |
| `is_active` | `isActive` | bool | Direct | Default: true |
| `image_url` | `imageUrl` | string | Direct | Optional |

### Natural Key
- **`nameAr`** - Arabic name uniquely identifies categories

### Example Transform
```json
// Legacy
{ "category_id": 5, "name_ar": "فواكه", "name_en": "Fruits", "parent_id": null }

// Platform
{ "nameAr": "فواكه", "nameEn": "Fruits", "parentId": null, "sortOrder": 0, "isActive": true }
```

---

## Products (المنتجات)

| Legacy Field | Platform Field | Type | Transform | Notes |
|--------------|----------------|------|-----------|-------|
| `product_id` | - | int | Ignored | Auto-generated UUID |
| `sku` | `sku` | string | Direct | Required, natural key |
| `name_ar` | `nameAr` | string | Direct | Required |
| `name_en` | `nameEn` | string | Direct | Optional |
| `description_ar` | `descriptionAr` | string | Direct | Optional |
| `price` | `priceIqd` | decimal | × 1000 | Convert if in dinars |
| `category_name` | `categoryId` | string→UUID | Lookup | Via category nameAr |
| `barcode` | `barcode` | string | Direct | Optional |
| `unit` | `unit` | string | Map | See unit mapping |
| `weight_kg` | `weightKg` | decimal | Direct | Optional |
| `is_active` | `isActive` | bool | Direct | Default: true |
| `image_url` | `imageUrl` | string | Direct | Optional |

### Natural Key
- **`sku`** - Stock Keeping Unit uniquely identifies products

### Unit Mapping
| Legacy | Platform |
|--------|----------|
| `كيلو` | `KG` |
| `حبة` | `PIECE` |
| `علبة` | `BOX` |
| `كرتون` | `CARTON` |
| `لتر` | `LITER` |
| `باكيت` | `PACK` |

### Price Handling
- Legacy prices in whole dinars: multiply by 1 (stored as IQD)
- Legacy prices in fils: divide by 1000
- Platform stores all prices in IQD (Iraqi Dinar)

### Example Transform
```json
// Legacy
{ "sku": "FRT001", "name_ar": "تفاح أحمر", "price": 2500, "category_name": "فواكه", "unit": "كيلو" }

// Platform
{ "sku": "FRT001", "nameAr": "تفاح أحمر", "priceIqd": 2500, "categoryId": "uuid-of-fruits", "unit": "KG" }
```

---

## Inventory (المخزون)

| Legacy Field | Platform Field | Type | Transform | Notes |
|--------------|----------------|------|-----------|-------|
| `inventory_id` | - | int | Ignored | Auto-generated |
| `product_sku` | `productId` | string→UUID | Lookup | Via SKU |
| `warehouse` | `locationId` | string→UUID | Lookup/Create | Location name |
| `quantity` | `quantity` | int | Direct | Current stock |
| `min_quantity` | `minQuantity` | int | Direct | Reorder point |
| `expiry_date` | `expiryDate` | date | Parse | ISO 8601 format |
| `batch_number` | `batchNumber` | string | Direct | Optional |

### Natural Key
- **`sku + location`** - Composite key identifies inventory records

### Location Auto-Creation
If a location doesn't exist, it will be created with:
```json
{ "name": "warehouse_name", "type": "WAREHOUSE", "isActive": true }
```

### Example Transform
```json
// Legacy
{ "product_sku": "FRT001", "warehouse": "المخزن الرئيسي", "quantity": 150, "min_quantity": 20 }

// Platform
{ "productId": "uuid-of-FRT001", "locationId": "uuid-of-main-warehouse", "quantity": 150, "minQuantity": 20 }
```

---

## Customers (العملاء)

| Legacy Field | Platform Field | Type | Transform | Notes |
|--------------|----------------|------|-----------|-------|
| `customer_id` | - | int | Ignored | Auto-generated UUID |
| `phone` | `phone` | string | Normalize | Natural key, +964 format |
| `name` | `name` | string | Direct | Required |
| `email` | `email` | string | Direct | Optional |
| `address` | `defaultAddress` | string | JSON | See address format |
| `area` | `defaultAddress.area` | string | Nested | Delivery zone |
| `notes` | `notes` | string | Direct | Optional |
| `created_at` | `createdAt` | date | Parse | ISO 8601 |

### Natural Key
- **`phone`** - Phone number uniquely identifies customers

### Phone Normalization
```
07XXXXXXXX  →  +9647XXXXXXXX
9647XXXXXXXX  →  +9647XXXXXXXX
+9647XXXXXXXX  →  +9647XXXXXXXX (unchanged)
```

### Address Format
```json
{
  "street": "شارع المتنبي",
  "area": "الكرادة",
  "city": "بغداد",
  "landmark": "قرب مول المنصور",
  "coordinates": { "lat": 33.3152, "lng": 44.3661 }
}
```

---

## Validation Rules

### Pre-Import Checks
1. **Categories**: nameAr must be unique
2. **Products**: SKU must be unique, category must exist
3. **Inventory**: Product SKU must exist
4. **Customers**: Phone must be valid Iraqi format

### Data Quality
| Check | Rule | Action |
|-------|------|--------|
| Empty nameAr | Required field | Skip record |
| Invalid price | Must be > 0 | Skip record |
| Duplicate SKU | Natural key violation | Update existing |
| Invalid phone | Not matching pattern | Skip record |
| Missing category | Product without category | Use "غير مصنف" |

---

## Error Handling

### Error Codes
| Code | Description | Recovery |
|------|-------------|----------|
| `E001` | Missing required field | Check source data |
| `E002` | Invalid data type | Fix in source |
| `E003` | Reference not found | Import dependencies first |
| `E004` | Duplicate natural key | Will update existing |
| `E005` | Validation failed | Check constraints |

### Error Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "entity": "Product",
  "record": { "sku": "PRD001" },
  "error": "E003",
  "message": "Category 'فواكه طازجة' not found",
  "action": "skipped"
}
```

---

## See Also

- `scripts/migrations/legacy/README.md` - Script usage
- `docs/CUTOVER_PLAN.md` - Go-live transition
- `docs/adr/0032-data-migration.md` - Architecture decision
