import { z } from 'zod';

import {
  UUIDSchema,
  DateTimeSchema,
  IQDAmountSchema,
  PaginatedResponseSchema,
  PaginationQuerySchema,
} from './common';

/**
 * Product unit enum
 */
export const ProductUnitSchema = z.enum([
  'PIECE',
  'KG',
  'GRAM',
  'LITER',
  'ML',
  'PACK',
  'BOX',
  'DOZEN',
]);
export type ProductUnit = z.infer<typeof ProductUnitSchema>;

/**
 * Product schema
 */
export const ProductSchema = z.object({
  id: UUIDSchema,
  sku: z.string(),
  barcode: z.string().nullable(),
  nameAr: z.string(),
  nameEn: z.string().nullable(),
  descriptionAr: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  categoryId: UUIDSchema,
  price: IQDAmountSchema,
  compareAtPrice: IQDAmountSchema.nullable(),
  costPrice: IQDAmountSchema.nullable(),
  stockQuantity: z.number().int(),
  lowStockThreshold: z.number().int().nullable(),
  aisle: z.string().nullable(),
  shelf: z.string().nullable(),
  bin: z.string().nullable(),
  weight: z.number().nullable(),
  unit: ProductUnitSchema,
  unitValue: z.number(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type Product = z.infer<typeof ProductSchema>;

/**
 * Product summary (for lists)
 */
export const ProductSummarySchema = z.object({
  id: UUIDSchema,
  sku: z.string(),
  nameAr: z.string(),
  nameEn: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  price: IQDAmountSchema,
  compareAtPrice: IQDAmountSchema.nullable(),
  stockQuantity: z.number().int(),
  unit: ProductUnitSchema,
  unitValue: z.number(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  categoryId: UUIDSchema,
});

export type ProductSummary = z.infer<typeof ProductSummarySchema>;

/**
 * Product query parameters
 */
export const ProductQuerySchema = PaginationQuerySchema.extend({
  categoryId: UUIDSchema.optional(),
  search: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
});

export type ProductQuery = z.infer<typeof ProductQuerySchema>;

/**
 * Create product request
 */
export const CreateProductRequestSchema = z.object({
  sku: z.string().min(1, 'SKU مطلوب'),
  barcode: z.string().optional(),
  nameAr: z.string().min(2, 'اسم المنتج بالعربية مطلوب'),
  nameEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string().url().optional(),
  categoryId: UUIDSchema,
  price: IQDAmountSchema,
  compareAtPrice: IQDAmountSchema.optional(),
  costPrice: IQDAmountSchema.optional(),
  stockQuantity: z.number().int().default(0),
  lowStockThreshold: z.number().int().optional(),
  aisle: z.string().optional(),
  shelf: z.string().optional(),
  bin: z.string().optional(),
  weight: z.number().optional(),
  unit: ProductUnitSchema.default('PIECE'),
  unitValue: z.number().default(1),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

/**
 * Update product request
 */
export const UpdateProductRequestSchema = CreateProductRequestSchema.partial();
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

/**
 * Product list response (simple)
 */
export const ProductListResponseSchema = z.object({
  data: z.array(ProductSummarySchema),
});

export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;

/**
 * Paginated product list response
 */
export const PaginatedProductListResponseSchema = PaginatedResponseSchema(ProductSummarySchema);
export type PaginatedProductListResponse = z.infer<typeof PaginatedProductListResponseSchema>;

/**
 * Product detail response
 */
export const ProductDetailResponseSchema = z.object({
  data: ProductSchema,
});

export type ProductDetailResponse = z.infer<typeof ProductDetailResponseSchema>;
