/**
 * Delivery-related types
 */

import type { BaseEntity } from '../common';

/**
 * Delivery status
 */
export enum DeliveryStatus {
  ASSIGNED = 'ASSIGNED', // تم التعيين
  PICKED_UP = 'PICKED_UP', // تم الاستلام من المتجر
  IN_TRANSIT = 'IN_TRANSIT', // في الطريق
  DELIVERED = 'DELIVERED', // تم التوصيل
  FAILED = 'FAILED', // فشل التوصيل
}

/**
 * Delivery assignment
 */
export interface DeliveryAssignment extends BaseEntity {
  orderId: string;
  driverId: string;
  status: DeliveryStatus;
  assignedAt: Date;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  collectedAmount: number | null; // Amount collected (IQD)
}

/**
 * Delivery with order details (for driver app)
 */
export interface DeliveryWithOrder extends DeliveryAssignment {
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    deliveryAddressText: string;
    total: number;
    notes: string | null;
  };
}

/**
 * Assign delivery DTO
 */
export interface AssignDeliveryDto {
  orderId: string;
  driverId: string;
}

/**
 * Complete delivery DTO
 */
export interface CompleteDeliveryDto {
  collectedAmount: number;
}

/**
 * Fail delivery DTO
 */
export interface FailDeliveryDto {
  reason: string;
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
 * Driver's active deliveries queue
 */
export interface DriverDeliveryQueue {
  driverId: string;
  deliveries: DeliveryWithOrder[];
  totalPending: number;
  totalCompleted: number;
}

/**
 * Delivery summary for reports
 */
export interface DeliverySummary {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  totalCollected: number; // IQD
  averageDeliveryTime: number; // minutes
}
