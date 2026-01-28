import { z } from 'zod';

import { UUIDSchema, DateTimeSchema, PaginatedResponseSchema } from './common';

/**
 * Category schema
 */
export const CategorySchema = z.object({
  id: UUIDSchema,
  nameAr: z.string(),
  nameEn: z.string().nullable(),
  slug: z.string(),
  descriptionAr: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  parentId: UUIDSchema.nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  productCount: z.number().int().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type Category = z.infer<typeof CategorySchema>;

/**
 * Category with children (for tree structure)
 */
export const CategoryWithChildrenSchema: z.ZodType<CategoryWithChildren> = CategorySchema.extend({
  children: z.lazy(() => z.array(CategoryWithChildrenSchema)).optional(),
});

export type CategoryWithChildren = z.infer<typeof CategorySchema> & {
  children?: CategoryWithChildren[];
};

/**
 * Create category request
 */
export const CreateCategoryRequestSchema = z.object({
  nameAr: z.string().min(2, 'اسم الفئة بالعربية مطلوب'),
  nameEn: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'الـ slug يجب أن يحتوي على حروف صغيرة وأرقام وشرطات فقط'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: UUIDSchema.optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

/**
 * Update category request
 */
export const UpdateCategoryRequestSchema = CreateCategoryRequestSchema.partial();
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

/**
 * Category list response
 */
export const CategoryListResponseSchema = z.object({
  data: z.array(CategorySchema),
});

export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;

/**
 * Paginated category list response
 */
export const PaginatedCategoryListResponseSchema = PaginatedResponseSchema(CategorySchema);
export type PaginatedCategoryListResponse = z.infer<typeof PaginatedCategoryListResponseSchema>;
