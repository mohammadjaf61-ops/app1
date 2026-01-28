/**
 * @hypermarket/contracts
 * Shared Zod schemas and type contracts for the hypermarket platform
 *
 * This package provides:
 * - Zod schemas for runtime validation
 * - TypeScript types inferred from schemas
 * - Shared contracts between backend and frontend
 */

// Re-export zod for convenience
export { z } from 'zod';
export type { ZodType, ZodTypeAny, ZodSchema } from 'zod';

// Common schemas
export {
  // Schemas
  TimestampsSchema,
  BaseEntitySchema,
  ApiErrorSchema,
  ApiExceptionSchema,
  PaginationMetaSchema,
  PaginationParamsSchema,
  SortDirectionSchema,
  SortParamsSchema,
  SuccessResponseSchema,
  // Factory functions
  createPaginatedResponseSchema,
  createApiResponseSchema,
  // Types
  type Timestamps,
  type BaseEntity,
  type ApiError,
  type ApiException,
  type PaginationMeta,
  type PaginationParams,
  type SortDirection,
  type SortParams,
  type SuccessResponse,
} from './common';

// Auth schemas
export {
  // Schemas
  UserRoleSchema,
  LoginRequestSchema,
  UserProfileSchema,
  TokenResponseSchema,
  LoginResponseSchema,
  OtpRequestSchema,
  OtpVerifyRequestSchema,
  OtpResponseSchema,
  OtpVerifyResponseSchema,
  RefreshTokenRequestSchema,
  ChangePasswordRequestSchema,
  // Types
  type UserRole,
  type LoginRequest,
  type UserProfile,
  type TokenResponse,
  type LoginResponse,
  type OtpRequest,
  type OtpVerifyRequest,
  type OtpResponse,
  type OtpVerifyResponse,
  type RefreshTokenRequest,
  type ChangePasswordRequest,
} from './auth';

// Product schemas
export {
  // Schemas
  ProductUnitSchema,
  CategoryRefSchema,
  ProductSchema,
  ProductWithCategorySchema,
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
  ProductQuerySchema,
  ProductListResponseSchema,
  ProductFiltersSchema,
  // Types
  type ProductUnit,
  type CategoryRef,
  type Product,
  type ProductWithCategory,
  type CreateProductRequest,
  type UpdateProductRequest,
  type ProductQuery,
  type ProductListResponse,
  type ProductFilters,
} from './product';

// Category schemas
export {
  // Schemas
  CategorySchema,
  CategoryWithParentSchema,
  CategoryTreeSchema,
  CategoryWithChildrenSchema,
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
  CategoryListResponseSchema,
  CategoryTreeResponseSchema,
  // Types
  type Category,
  type CategoryWithParent,
  type CategoryTree,
  type CategoryWithChildren,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
  type CategoryListResponse,
  type CategoryTreeResponse,
} from './category';

// Order schemas
export {
  // Schemas
  OrderStatusSchema,
  PaymentMethodSchema,
  DeliveryStatusSchema,
  OrderProductRefSchema,
  OrderItemSchema,
  UserRefSchema,
  DeliveryAssignmentSchema,
  OrderSchema,
  OrderWithItemsSchema,
  CreateOrderItemRequestSchema,
  CreateOrderRequestSchema,
  CreateOrderResponseSchema,
  UpdateOrderStatusRequestSchema,
  AssignPickerRequestSchema,
  MarkOrderPaidRequestSchema,
  CancelOrderRequestSchema,
  OrderQuerySchema,
  OrderListResponseSchema,
  OrderStatisticsResponseSchema,
  // Types
  type OrderStatus,
  type PaymentMethod,
  type DeliveryStatus,
  type OrderProductRef,
  type OrderItem,
  type UserRef,
  type DeliveryAssignment,
  type Order,
  type OrderWithItems,
  type CreateOrderItemRequest,
  type CreateOrderRequest,
  type CreateOrderResponse,
  type UpdateOrderStatusRequest,
  type AssignPickerRequest,
  type MarkOrderPaidRequest,
  type CancelOrderRequest,
  type OrderQuery,
  type OrderListResponse,
  type OrderStatisticsResponse,
} from './order';
