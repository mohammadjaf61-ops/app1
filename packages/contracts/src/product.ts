/**
 * Product Zod schemas
 */
import { z } from 'zod';
import { BaseEntitySchema, PaginationMetaSchema } from './common';

/**
 * Product unit enum
 */
export const ProductUnitSchema = z.enum([
  'PIECE',
  'KILOGRAM',
  'GRAM',
  'LITER',
  'MILLILITER',
  'METER',
  'CENTIMETER',
  'BOX',
  'PACK',
  'BOTTLE',
  'CAN',
  'BAG',
]);

export type ProductUnit = z.infer<typeof ProductUnitSchema>;

/**
 * Category reference (minimal for product responses)
 */
export const CategoryRefSchema = z.object({
  id: z.string().uuid(),
  nameAr: z.string(),
  nameEn: z.string().nullable().optional(),
  slug: z.string().optional(),
});

export type CategoryRef = z.infer<typeof CategoryRefSchema>;

/**
 * Product schema
 * Matches the backend response shape
 */
export const ProductSchema = BaseEntitySchema.extend({
  sku: z.string(),
  barcode: z.string().nullable().optional(),
  nameAr: z.string(),
  nameEn: z.string().nullable().optional(),
  descriptionAr: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  categoryId: z.string().uuid(),
  // Price fields - backend uses different field names
  price: z.number().optional(),
  costPrice: z.number().optional(),
  salePrice: z.number().optional(),
  compareAtPrice: z.number().nullable().optional(),
  // Stock fields
  stockQuantity: z.number().int().optional(),
  lowStockThreshold: z.number().int().optional(),
  // Location fields
  aisle: z.string().optional(),
  shelf: z.string().optional(),
  bin: z.string().nullable().optional(),
  // Additional fields
  weight: z.number().nullable().optional(),
  unit: ProductUnitSchema.optional(),
  unitValue: z.number().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean().optional(),
  deletedAt: z.string().datetime().nullable().or(z.date().nullable()).optional(),
  // Category relation (when included)
  category: CategoryRefSchema.optional(),
});

export type Product = z.infer<typeof ProductSchema>;

/**
 * Product with category (for detailed responses)
 */
export const ProductWithCategorySchema = ProductSchema.extend({
  category: CategoryRefSchema,
});

export type ProductWithCategory = z.infer<typeof ProductWithCategorySchema>;

/**
 * Create product request schema
 */
export const CreateProductRequestSchema = z.object({
  sku: z.string().min(1, 'رمز المنتج مطلوب'),
  barcode: z.string().optional(),
  nameAr: z.string().min(1, 'اسم المنتج بالعربية مطلوب'),
  nameEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  categoryId: z.string().uuid('معرف التصنيف غير صالح'),
  price: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي صفر'),
  compareAtPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0, 'الكمية يجب أن تكون أكبر من أو تساوي صفر'),
  lowStockThreshold: z.number().int().min(0).optional(),
  aisle: z.string().min(1, 'رقم الممر مطلوب'),
  shelf: z.string().min(1, 'رقم الرف مطلوب'),
  bin: z.string().optional(),
  weight: z.number().min(0).optional(),
  unit: ProductUnitSchema,
  unitValue: z.number().min(0),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

/**
 * Update product request schema
 */
export const UpdateProductRequestSchema = CreateProductRequestSchema.partial();

export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

/**
 * Product query parameters schema
 */
export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
});

export type ProductQuery = z.infer<typeof ProductQuerySchema>;

/**
 * Product list response schema (paginated)
 */
export const ProductListResponseSchema = z.object({
  data: z.array(ProductSchema),
  meta: PaginationMetaSchema,
});

export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;

/**
 * Product filters schema (for client-side filtering)
 */
export const ProductFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
});

export type ProductFilters = z.infer<typeof ProductFiltersSchema>;
