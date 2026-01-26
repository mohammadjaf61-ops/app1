/**
 * Financial types
 */

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
