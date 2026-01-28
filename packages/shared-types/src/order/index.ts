/**
 * Order-related types
 */

import type { BaseEntity } from '../common';

/**
 * Order status
 */
export enum OrderStatus {
  PENDING = 'PENDING', // قيد الانتظار
  PICKING = 'PICKING', // قيد التجهيز
  READY = 'READY', // جاهز
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // في الطريق
  DELIVERED = 'DELIVERED', // تم التوصيل
  CANCELLED = 'CANCELLED', // ملغي
  COMPLETED = 'COMPLETED', // POS order completed - مكتمل
}

/**
 * Order type - distinguishes delivery orders from POS sales
 */
export enum OrderType {
  DELIVERY = 'DELIVERY', // Online order for delivery
  POS = 'POS', // In-store point of sale
}

/**
 * Payment method
 * COD is primary for Iraq market
 */
export enum PaymentMethod {
  COD = 'COD', // الدفع عند الاستلام - Cash on Delivery
  CARD = 'CARD', // Card payment via gateway (future)
  CASH = 'CASH', // In-store cash payment (POS)
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'PENDING', // قيد الانتظار
  PAID = 'PAID', // مدفوع
  FAILED = 'FAILED', // فشل
  REFUNDED = 'REFUNDED', // مسترجع
}

/**
 * Order
 * Note: Customer info stored directly on order (no customer accounts in MVP)
 */
export interface Order extends BaseEntity {
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddressText: string | null;
  subtotal: number; // IQD
  deliveryFee: number; // IQD
  total: number; // IQD
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  notes: string | null;
  pickerId: string | null;
  cashierId: string | null;
  pickedAt: Date | null;
  deliveredAt: Date | null;
}

/**
 * Order item
 */
export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  productPriceSnapshot: number; // IQD
  quantity: number;
  total: number; // IQD
}

/**
 * Order with items
 */
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

/**
 * Create order DTO
 */
export interface CreateOrderDto {
  customerName: string;
  customerPhone: string;
  deliveryAddressText: string;
  items: CreateOrderItemDto[];
  notes?: string;
}

/**
 * Create order item DTO
 */
export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

/**
 * Order filters for admin
 */
export interface OrderFilters {
  status?: OrderStatus;
  orderType?: OrderType;
  pickerId?: string;
  cashierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  isPaid?: boolean;
}

/**
 * Order status update DTO
 */
export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}

/**
 * Assign picker DTO
 */
export interface AssignPickerDto {
  pickerId: string;
}

/**
 * Mark order paid DTO
 */
export interface MarkOrderPaidDto {
  isPaid: boolean;
}

/**
 * Order summary for reports
 */
export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number; // IQD
  averageOrderValue: number; // IQD
  ordersByStatus: Record<OrderStatus, number>;
}
