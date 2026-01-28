/**
 * Common Zod schemas used across the hypermarket platform
 */
import { z } from 'zod';

/**
 * Timestamps schema
 */
export const TimestampsSchema = z.object({
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export type Timestamps = z.infer<typeof TimestampsSchema>;

/**
 * Base entity schema with common fields
 */
export const BaseEntitySchema = TimestampsSchema.extend({
  id: z.string().uuid(),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * API Error schema
 */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * API Exception schema (for HTTP errors)
 */
export const ApiExceptionSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  errorCode: z.string().optional(),
});

export type ApiException = z.infer<typeof ApiExceptionSchema>;

/**
 * Pagination metadata schema
 */
export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Pagination query parameters schema
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/**
 * Sort direction
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof SortDirectionSchema>;

/**
 * Sort parameters schema
 */
export const SortParamsSchema = z.object({
  sortBy: z.string().optional(),
  sortDirection: SortDirectionSchema.optional(),
});

export type SortParams = z.infer<typeof SortParamsSchema>;

/**
 * Generic paginated response wrapper
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}

/**
 * Generic API response wrapper
 */
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    message: z.string().optional(),
    errors: z.array(ApiErrorSchema).optional(),
    meta: PaginationMetaSchema.optional(),
  });
}

/**
 * Success response schema (for operations without data)
 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
