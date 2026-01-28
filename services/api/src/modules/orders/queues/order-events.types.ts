import type { OrderStatus } from '@hypermarket/shared-types';

/**
 * Base payload for all order event jobs
 */
interface BaseOrderEventPayload {
  orderId: string;
  orderNumber: string;
  timestamp: string;
}

/**
 * Payload for ORDER_CREATED job
 */
export interface OrderCreatedPayload extends BaseOrderEventPayload {
  customerPhone: string;
  totalAmountIqd: number;
  itemCount: number;
}

/**
 * Payload for ORDER_STATUS_CHANGED job
 */
export interface OrderStatusChangedPayload extends BaseOrderEventPayload {
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  actorId?: string;
}

/**
 * Payload for ORDER_PICKER_ASSIGNED job
 */
export interface OrderPickerAssignedPayload extends BaseOrderEventPayload {
  pickerId: string;
  pickerName: string;
}

/**
 * Payload for ORDER_CANCELLED job
 */
export interface OrderCancelledPayload extends BaseOrderEventPayload {
  reason: string;
  cancelledBy?: string;
}
