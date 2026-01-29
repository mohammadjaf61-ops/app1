/**
 * Order Zod schemas
 */
import { z } from 'zod';

import { BaseEntitySchema, PaginationMetaSchema } from './common';

/**
 * Order status enum
 */
export const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PICKING',
  'PICKED',
  'READY',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * Payment method enum
 */
export const PaymentMethodSchema = z.enum(['COD']);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

/**
 * Delivery status enum
 */
export const DeliveryStatusSchema = z.enum([
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'RETURNED',
]);

export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

/**
 * Iraqi phone number pattern (07XXXXXXXXX)
 */
const iraqiPhoneRegex = /^07[0-9]{9}$/;

/**
 * Product reference in order item
 */
export const OrderProductRefSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  nameAr: z.string(),
  imageUrl: z.string().url().nullable().optional(),
});

export type OrderProductRef = z.infer<typeof OrderProductRefSchema>;

/**
 * Order item schema
 */
export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  productNameSnapshot: z.string().optional(),
  productPriceSnapshot: z.number().optional(),
  quantity: z.number().int().positive(),
  unitPriceIqd: z.number().optional(),
  total: z.number().optional(),
  createdAt: z.string().datetime().or(z.date()).optional(),
  product: OrderProductRefSchema.optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

/**
 * User reference (picker/driver)
 */
export const UserRefSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  phone: z.string().optional(),
});

export type UserRef = z.infer<typeof UserRefSchema>;

/**
 * Delivery assignment schema
 */
export const DeliveryAssignmentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  driverId: z.string().uuid(),
  status: DeliveryStatusSchema,
  assignedAt: z.string().datetime().or(z.date()),
  deliveredAt: z.string().datetime().or(z.date()).nullable().optional(),
  notes: z.string().nullable().optional(),
  driver: UserRefSchema.optional(),
});

export type DeliveryAssignment = z.infer<typeof DeliveryAssignmentSchema>;

/**
 * Order schema
 */
export const OrderSchema = BaseEntitySchema.extend({
  orderNumber: z.string(),
  status: OrderStatusSchema,
  customerName: z.string(),
  customerPhone: z.string(),
  deliveryAddressText: z.string(),
  subtotal: z.number().optional(),
  deliveryFee: z.number().optional(),
  total: z.number(),
  totalAmountIqd: z.number().optional(),
  paymentMethod: PaymentMethodSchema,
  isPaid: z.boolean(),
  notes: z.string().nullable(),
  pickerId: z.string().uuid().nullable(),
  pickedAt: z.string().datetime().or(z.date()).nullable().optional(),
  deliveredAt: z.string().datetime().or(z.date()).nullable().optional(),
  // Relations
  picker: UserRefSchema.nullable().optional(),
  items: z.array(OrderItemSchema).optional(),
  deliveryAssignment: DeliveryAssignmentSchema.nullable().optional(),
  _count: z
    .object({
      items: z.number(),
    })
    .optional(),
});

export type Order = z.infer<typeof OrderSchema>;

/**
 * Order with items
 */
export const OrderWithItemsSchema = OrderSchema.extend({
  items: z.array(OrderItemSchema),
});

export type OrderWithItems = z.infer<typeof OrderWithItemsSchema>;

/**
 * Create order item request schema
 */
export const CreateOrderItemRequestSchema = z.object({
  productId: z.string().uuid('معرّف المنتج غير صالح'),
  quantity: z.number().int().min(1, 'الكمية يجب أن تكون واحد على الأقل'),
});

export type CreateOrderItemRequest = z.infer<typeof CreateOrderItemRequestSchema>;

/**
 * Create order request schema
 */
export const CreateOrderRequestSchema = z.object({
  customerName: z.string().min(1, 'اسم العميل مطلوب'),
  customerPhone: z.string().regex(iraqiPhoneRegex, 'رقم الهاتف غير صالح'),
  deliveryAddressText: z.string().min(1, 'عنوان التوصيل مطلوب'),
  items: z.array(CreateOrderItemRequestSchema).min(1, 'يجب إضافة منتج واحد على الأقل'),
  notes: z.string().optional(),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

/**
 * Create order response schema
 */
export const CreateOrderResponseSchema = OrderWithItemsSchema;

export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

/**
 * Update order status request schema
 */
export const UpdateOrderStatusRequestSchema = z.object({
  status: OrderStatusSchema,
  notes: z.string().optional(),
});

export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusRequestSchema>;

/**
 * Assign picker request schema
 */
export const AssignPickerRequestSchema = z.object({
  pickerId: z.string().uuid('معرّف الجامع غير صالح'),
});

export type AssignPickerRequest = z.infer<typeof AssignPickerRequestSchema>;

/**
 * Mark order paid request schema
 */
export const MarkOrderPaidRequestSchema = z.object({
  isPaid: z.boolean(),
});

export type MarkOrderPaidRequest = z.infer<typeof MarkOrderPaidRequestSchema>;

/**
 * Cancel order request schema
 */
export const CancelOrderRequestSchema = z.object({
  reason: z.string().optional(),
});

export type CancelOrderRequest = z.infer<typeof CancelOrderRequestSchema>;

/**
 * Order query parameters schema
 */
export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: OrderStatusSchema.optional(),
  pickerId: z.string().uuid().optional(),
  isPaid: z.coerce.boolean().optional(),
  search: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type OrderQuery = z.infer<typeof OrderQuerySchema>;

/**
 * Order list response schema (paginated)
 */
export const OrderListResponseSchema = z.object({
  data: z.array(OrderSchema),
  meta: PaginationMetaSchema,
});

export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;

/**
 * Order statistics response schema
 */
export const OrderStatisticsResponseSchema = z.object({
  totalOrders: z.number().int(),
  pendingOrders: z.number().int(),
  pickingOrders: z.number().int(),
  readyOrders: z.number().int(),
  deliveredOrders: z.number().int(),
  cancelledOrders: z.number().int(),
  totalRevenue: z.number(),
});

export type OrderStatisticsResponse = z.infer<typeof OrderStatisticsResponseSchema>;
