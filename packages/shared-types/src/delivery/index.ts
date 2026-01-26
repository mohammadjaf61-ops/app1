/**
 * Delivery-related types
 */

import type { BaseEntity, DeliveryAddress, MoneyAmount } from '../common';

/**
 * Delivery status
 */
export enum DeliveryStatus {
  PENDING = 'PENDING', // في انتظار التعيين
  ASSIGNED = 'ASSIGNED', // تم التعيين
  PICKED_UP = 'PICKED_UP', // تم الاستلام من المتجر
  IN_TRANSIT = 'IN_TRANSIT', // في الطريق
  ARRIVED = 'ARRIVED', // وصل للموقع
  DELIVERED = 'DELIVERED', // تم التوصيل
  FAILED = 'FAILED', // فشل التوصيل
  RETURNED = 'RETURNED', // تم الإرجاع
}

/**
 * Delivery failure reasons
 */
export enum DeliveryFailureReason {
  CUSTOMER_UNAVAILABLE = 'CUSTOMER_UNAVAILABLE', // العميل غير متواجد
  WRONG_ADDRESS = 'WRONG_ADDRESS', // عنوان خاطئ
  CUSTOMER_REFUSED = 'CUSTOMER_REFUSED', // العميل رفض الاستلام
  PAYMENT_ISSUE = 'PAYMENT_ISSUE', // مشكلة في الدفع
  OTHER = 'OTHER', // سبب آخر
}

/**
 * Delivery record
 */
export interface Delivery extends BaseEntity {
  orderId: string;
  orderNumber: string;
  driverId: string;
  status: DeliveryStatus;
  deliveryAddress: DeliveryAddress;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  totalAmount: MoneyAmount;
  collectedAmount?: MoneyAmount;
  assignedAt: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: DeliveryFailureReason;
  failureNotes?: string;
  deliveryNotes?: string;
  customerSignature?: string; // Base64 signature
}

/**
 * Driver's active deliveries
 */
export interface DriverDeliveryQueue {
  driverId: string;
  deliveries: Delivery[];
  totalPending: number;
}

/**
 * Delivery assignment DTO
 */
export interface AssignDeliveryDto {
  orderId: string;
  driverId: string;
  notes?: string;
}

/**
 * Complete delivery DTO
 */
export interface CompleteDeliveryDto {
  deliveryId: string;
  collectedAmount: number;
  signature?: string;
  notes?: string;
}

/**
 * Fail delivery DTO
 */
export interface FailDeliveryDto {
  deliveryId: string;
  reason: DeliveryFailureReason;
  notes?: string;
}

/**
 * Delivery filters for admin
 */
export interface DeliveryFilters {
  status?: DeliveryStatus;
  driverId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Delivery zone configuration
 */
export interface DeliveryZone extends BaseEntity {
  name: string;
  governorate: string;
  districts: string[];
  deliveryFee: MoneyAmount;
  estimatedMinutes: number;
  isActive: boolean;
}

/**
 * Delivery time slot
 */
export interface DeliveryTimeSlot {
  id: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  maxOrders: number;
  currentOrders: number;
  isAvailable: boolean;
}
