import type { OrderErrorType, PendingOrder } from '../stores/orderQueueStore';

export const DEFAULT_MAX_RETRY_ATTEMPTS = 5;
export const DEFAULT_RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000];

export interface OrderQueueActions {
  updateStatus: (id: string, status: PendingOrder['status']) => void;
  incrementAttempt: (id: string) => void;
  removeOrder: (id: string) => void;
  setError: (id: string, type: OrderErrorType, message?: string) => void;
  clearError: (id: string) => void;
}

export interface SubmitOrderResult {
  ok: boolean;
  errorType?: OrderErrorType;
  message?: string;
}

export interface ProcessOrderQueueOptions {
  isOnline: boolean;
  pendingOrders: PendingOrder[];
  submitOrder: (order: PendingOrder) => Promise<SubmitOrderResult>;
  actions: OrderQueueActions;
  logger?: {
    info: (message: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
  };
  maxRetryAttempts?: number;
  retryDelays?: number[];
}

const sleep = (delayMs: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), delayMs));

export async function processOrderQueue({
  isOnline,
  pendingOrders,
  submitOrder,
  actions,
  logger,
  maxRetryAttempts = DEFAULT_MAX_RETRY_ATTEMPTS,
  retryDelays = DEFAULT_RETRY_DELAYS,
}: ProcessOrderQueueOptions): Promise<void> {
  if (!isOnline) {
    return;
  }

  const pending = pendingOrders.filter((order) => order.status === 'pending');
  if (pending.length === 0) {
    return;
  }

  for (const order of pending) {
    const nextAttempt = order.attemptCount + 1;
    if (nextAttempt > maxRetryAttempts) {
      actions.updateStatus(order.id, 'failed');
      actions.setError(order.id, 'server', 'Max retry attempts reached');
      logger?.warn('Order failed', { requestId: order.id, errorCode: 'server' });
      continue;
    }

    actions.updateStatus(order.id, 'sending');
    actions.clearError(order.id);
    actions.incrementAttempt(order.id);

    logger?.info('Order retry', {
      requestId: order.id,
      metadata: { attempt: nextAttempt },
    });

    const result = await submitOrder(order);

    if (result.ok) {
      logger?.info('Order sent', { requestId: order.id });
      actions.removeOrder(order.id);
      logger?.info('Order synced/removed', { requestId: order.id });
      continue;
    }

    if (result.errorType === 'validation') {
      actions.updateStatus(order.id, 'failed');
      actions.setError(order.id, 'validation', result.message);
      logger?.warn('Order failed', { requestId: order.id, errorCode: 'validation' });
      logger?.warn('Order validation failed', {
        requestId: order.id,
        errorCode: 'validation',
      });
      continue;
    }

    if (result.errorType === 'server') {
      actions.setError(order.id, 'server', result.message);
      if (nextAttempt >= maxRetryAttempts) {
        actions.updateStatus(order.id, 'failed');
        logger?.warn('Order failed', { requestId: order.id, errorCode: 'server' });
        logger?.warn('Order retry exhausted', { requestId: order.id, errorCode: 'server' });
        continue;
      }
    }

    if (result.errorType === 'network') {
      actions.setError(order.id, 'network', result.message);
      logger?.warn('Order retry deferred (network)', {
        requestId: order.id,
        errorCode: 'network',
      });
    }

    actions.updateStatus(order.id, 'pending');
    const delay = retryDelays[Math.min(order.attemptCount, retryDelays.length - 1)];
    await sleep(delay);
  }
}
