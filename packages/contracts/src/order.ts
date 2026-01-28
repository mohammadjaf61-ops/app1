import { z } from 'zod';

import {
  UUIDSchema,
  DateTimeSchema,
  IQDAmountSchema,
  IraqiPhoneSchema,
  PaginatedResponseSchema,
  PaginationQuerySchema,
} from './common';
import { ProductSummarySchema } from './product';

/**
 * Order status enum
 */
export const OrderStatusSchema = z.enum([
  'PENDING',
  'PICKING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * Payment method enum
 */
export const PaymentMethodSchema = z.enum(['COD', 'PAID']);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

/**
 * Order item in create request
 */
export const OrderItemRequestSchema = z.object({
  productId: UUIDSchema,
  quantity: z.number().int().min(1, 'الكمية يجب أن تكون 1 على الأقل'),
});

export type OrderItemRequest = z.infer<typeof OrderItemRequestSchema>;

/**
 * Create order request
 */
export const CreateOrderRequestSchema = z.object({
  customerName: z.string().min(2, 'اسم العميل مطلوب'),
  customerPhone: IraqiPhoneSchema,
  deliveryAddressText: z.string().min(10, 'عنوان التوصيل مطلوب'),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  items: z.array(OrderItemRequestSchema).min(1, 'يجب إضافة منتج واحد على الأقل'),
  notes: z.string().optional(),
  paymentMethod: PaymentMethodSchema.default('COD'),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

/**
 * Order item in response
 */
export const OrderItemSchema = z.object({
  id: UUIDSchema,
  productId: UUIDSchema,
  product: ProductSummarySchema.optional(),
  productNameAr: z.string(),
  productNameEn: z.string().nullable(),
  quantity: z.number().int(),
  unitPrice: IQDAmountSchema,
  totalPrice: IQDAmountSchema,
  pickedQuantity: z.number().int().nullable(),
  isPicked: z.boolean(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

/**
 * Order schema
 */
export const OrderSchema = z.object({
  id: UUIDSchema,
  orderNumber: z.string(),
  customerId: UUIDSchema.nullable(),
  customerName: z.string(),
  customerPhone: z.string(),
  deliveryAddressText: z.string(),
  deliveryLat: z.number().nullable(),
  deliveryLng: z.number().nullable(),
  status: OrderStatusSchema,
  paymentMethod: PaymentMethodSchema,
  subtotal: IQDAmountSchema,
  deliveryFee: IQDAmountSchema,
  discount: IQDAmountSchema,
  total: IQDAmountSchema,
  notes: z.string().nullable(),
  pickerId: UUIDSchema.nullable(),
  driverId: UUIDSchema.nullable(),
  pickedAt: DateTimeSchema.nullable(),
  deliveredAt: DateTimeSchema.nullable(),
  items: z.array(OrderItemSchema),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type Order = z.infer<typeof OrderSchema>;

/**
 * Order summary (for lists)
 */
export const OrderSummarySchema = z.object({
  id: UUIDSchema,
  orderNumber: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  deliveryAddressText: z.string(),
  status: OrderStatusSchema,
  paymentMethod: PaymentMethodSchema,
  total: IQDAmountSchema,
  itemCount: z.number().int(),
  createdAt: DateTimeSchema,
});

export type OrderSummary = z.infer<typeof OrderSummarySchema>;

/**
 * Order query parameters
 */
export const OrderQuerySchema = PaginationQuerySchema.extend({
  status: OrderStatusSchema.optional(),
  customerId: UUIDSchema.optional(),
  pickerId: UUIDSchema.optional(),
  driverId: UUIDSchema.optional(),
});

export type OrderQuery = z.infer<typeof OrderQuerySchema>;

/**
 * Update order status request
 */
export const UpdateOrderStatusRequestSchema = z.object({
  status: OrderStatusSchema,
  notes: z.string().optional(),
});

export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusRequestSchema>;

/**
 * Create order response
 */
export const CreateOrderResponseSchema = z.object({
  data: OrderSchema,
  message: z.string().optional(),
});

export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

/**
 * Order list response
 */
export const OrderListResponseSchema = z.object({
  data: z.array(OrderSummarySchema),
});

export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;

/**
 * Paginated order list response
 */
export const PaginatedOrderListResponseSchema = PaginatedResponseSchema(OrderSummarySchema);
export type PaginatedOrderListResponse = z.infer<typeof PaginatedOrderListResponseSchema>;

/**
 * Order detail response
 */
export const OrderDetailResponseSchema = z.object({
  data: OrderSchema,
});

export type OrderDetailResponse = z.infer<typeof OrderDetailResponseSchema>;
