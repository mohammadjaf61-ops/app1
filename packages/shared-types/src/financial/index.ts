/**
 * Financial types
 */

import type { PaymentMethod, PaymentStatus } from '../order';

/**
 * Payment record
 */
export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountIqd: number;
  providerRef: string | null;
  providerName: string | null;
  paidAt: Date | null;
  paidBy: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create payment DTO
 */
export interface CreatePaymentDto {
  orderId: string;
  method: PaymentMethod;
  amountIqd: number;
}

/**
 * Update payment status DTO
 */
export interface UpdatePaymentStatusDto {
  status: PaymentStatus;
  paidBy?: string;
  failureReason?: string;
}

/**
 * Refund record
 */
export interface Refund {
  id: string;
  orderId: string;
  amountIqd: number;
  reason: string;
  createdBy: string | null;
  createdAt: Date;
}

/**
 * Create refund DTO
 */
export interface CreateRefundDto {
  orderId: string;
  amountIqd: number;
  reason: string;
}

/**
 * Refund filters
 */
export interface RefundFilters {
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Daily sales summary
 */
export interface DailySalesSummary {
  date: Date;
  totalOrders: number;
  totalAmountIqd: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedAmountIqd: number;
}

/**
 * Product sales summary
 */
export interface ProductSalesSummary {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalAmountIqd: number;
  orderCount: number;
}
