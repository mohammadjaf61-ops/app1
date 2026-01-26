/**
 * Order-related types
 */

import type { BaseEntity, MoneyAmount, DeliveryAddress } from '../common';
import type { Product, StoreLocation } from '../product';

/**
 * Order status
 */
export enum OrderStatus {
  PENDING = 'PENDING', // قيد الانتظار
  CONFIRMED = 'CONFIRMED', // مؤكد
  PICKING = 'PICKING', // قيد التجهيز
  PICKED = 'PICKED', // تم التجهيز
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', // جاهز للتوصيل
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // في الطريق
  DELIVERED = 'DELIVERED', // تم التوصيل
  CANCELLED = 'CANCELLED', // ملغي
  REFUNDED = 'REFUNDED', // مسترد
}

/**
 * Payment method
 * COD is primary for Iraq market
 */
export enum PaymentMethod {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY', // الدفع عند الاستلام
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * Order
 */
export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: MoneyAmount;
  deliveryFee: MoneyAmount;
  discount: MoneyAmount;
  total: MoneyAmount;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: DeliveryAddress;
  notes?: string;
  pickerId?: string;
  driverId?: string;
  pickedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

/**
 * Order item
 */
export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  productSnapshot: OrderProductSnapshot;
  quantity: number;
  unitPrice: MoneyAmount;
  totalPrice: MoneyAmount;
  pickedQuantity?: number;
  pickingNotes?: string;
}

/**
 * Snapshot of product at time of order
 * Preserved for historical accuracy
 */
export interface OrderProductSnapshot {
  sku: string;
  name: string;
  imageUrl?: string;
  location: StoreLocation;
}

/**
 * Cart item (client-side)
 */
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

/**
 * Create order DTO
 */
export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  deliveryAddressId: string;
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
  customerId?: string;
  pickerId?: string;
  driverId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Picker order view with location info
 */
export interface PickerOrderItem extends OrderItem {
  location: StoreLocation;
  isPicked: boolean;
}

/**
 * Order status update DTO
 */
export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}
