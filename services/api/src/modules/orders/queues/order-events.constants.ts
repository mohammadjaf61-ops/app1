/**
 * Order Events Queue Constants
 *
 * Defines queue names and job types for async order event processing.
 * Jobs in this queue run outside the main request cycle to keep
 * order creation/updates fast and responsive.
 */

export const ORDER_EVENTS_QUEUE = 'order-events';

/**
 * Job names for order events processing
 */
export const OrderEventJobs = {
  /** Triggered after successful order creation */
  ORDER_CREATED: 'order-created',

  /** Triggered after order status change */
  ORDER_STATUS_CHANGED: 'order-status-changed',

  /** Triggered after picker assignment */
  ORDER_PICKER_ASSIGNED: 'order-picker-assigned',

  /** Triggered after order cancellation */
  ORDER_CANCELLED: 'order-cancelled',
} as const;

export type OrderEventJobName = (typeof OrderEventJobs)[keyof typeof OrderEventJobs];
