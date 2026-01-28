/**
 * Category Zod schemas
 */
import { z } from 'zod';
import { BaseEntitySchema } from './common';

/**
 * Category schema
 * Matches the backend response shape
 */
export const CategorySchema = BaseEntitySchema.extend({
  nameAr: z.string(),
  nameEn: z.string().nullable().optional(),
  slug: z.string().optional(),
  descriptionAr: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  parentId: z.string().uuid().nullable(),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
  deletedAt: z.string().datetime().nullable().or(z.date().nullable()).optional(),
});

export type Category = z.infer<typeof CategorySchema>;

/**
 * Category with parent relation
 */
export const CategoryWithParentSchema = CategorySchema.extend({
  parent: CategorySchema.nullable().optional(),
});

export type CategoryWithParent = z.infer<typeof CategoryWithParentSchema>;

/**
 * Base category for tree without defaults (for recursive types)
 */
const BaseCategoryTreeSchema = z.object({
  id: z.string().uuid(),
  nameAr: z.string(),
  nameEn: z.string().nullable().optional(),
  slug: z.string().optional(),
  descriptionAr: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  parentId: z.string().uuid().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

/**
 * Category tree schema (recursive)
 */
export interface CategoryTree {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  slug?: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  imageUrl?: string | null;
  parentId: string | null;
  sortOrder?: number;
  isActive?: boolean;
  deletedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  children: CategoryTree[];
}

export const CategoryTreeSchema: z.ZodType<CategoryTree> = BaseCategoryTreeSchema.extend({
  children: z.lazy(() => z.array(CategoryTreeSchema)),
});

/**
 * Category with children
 */
export const CategoryWithChildrenSchema = CategorySchema.extend({
  children: z.array(CategorySchema),
  parent: CategorySchema.nullable().optional(),
});

export type CategoryWithChildren = z.infer<typeof CategoryWithChildrenSchema>;

/**
 * Create category request schema
 */
export const CreateCategoryRequestSchema = z.object({
  nameAr: z.string().min(1, 'اسم التصنيف بالعربية مطلوب'),
  nameEn: z.string().optional(),
  slug: z.string().min(1, 'المعرف الفريد مطلوب'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

/**
 * Update category request schema
 */
export const UpdateCategoryRequestSchema = CreateCategoryRequestSchema.partial();

export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

/**
 * Category list response schema
 */
export const CategoryListResponseSchema = z.array(CategorySchema);

export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;

/**
 * Category tree response schema
 */
export const CategoryTreeResponseSchema = z.array(CategoryTreeSchema);

export type CategoryTreeResponse = z.infer<typeof CategoryTreeResponseSchema>;
