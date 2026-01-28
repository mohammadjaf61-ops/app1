import { z } from 'zod';

/**
 * Iraqi phone number format: 07XXXXXXXXX (11 digits)
 */
export const IraqiPhoneSchema = z
  .string()
  .regex(/^07[0-9]{9}$/, 'رقم الهاتف يجب أن يكون بصيغة 07XXXXXXXXX');

/**
 * Pagination request parameters
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Pagination metadata in responses
 */
export const PaginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Paginated response wrapper
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

/**
 * Standard API error response
 */
export const ApiErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  error: z.string().optional(),
  errorCode: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

/**
 * Standard success response wrapper
 */
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

/**
 * UUID schema for IDs
 */
export const UUIDSchema = z.string().uuid();

/**
 * ISO datetime string schema
 */
export const DateTimeSchema = z.string().datetime();

/**
 * Currency amount in IQD (stored as integer - no decimals)
 */
export const IQDAmountSchema = z.number().int().nonnegative();
