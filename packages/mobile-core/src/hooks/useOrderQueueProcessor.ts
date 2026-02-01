import { useCallback, useEffect, useRef } from 'react';

import type { OrderErrorType, PendingOrder } from '../stores/orderQueueStore';
import { useOrderQueueStore } from '../stores/orderQueueStore';
import { createLogger } from '../utils/logger';

import { useNetworkStatus } from './useNetworkStatus';

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000];

interface OrderQueueProcessorOptions {
  baseUrl: string;
}

const logger = createLogger({ scope: 'OrderQueue', enabled: __DEV__ });

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }
  const record = payload as { message?: string };
  if (typeof record.message === 'string') {
    return record.message;
  }
  return undefined;
}

async function classifyOrderResponse(response: Response): Promise<{
  ok: boolean;
  errorType?: OrderErrorType;
  message?: string;
}> {
  if (response.ok) {
    return { ok: true };
  }

  const errorPayload = await response.json().catch(() => null);
  const message = getErrorMessage(errorPayload);

  if (response.status === 400 || response.status === 422) {
    return { ok: false, errorType: 'validation', message };
  }

  if (response.status >= 500) {
    return { ok: false, errorType: 'server', message };
  }

  return { ok: false, errorType: 'validation', message };
}

async function submitOrder(baseUrl: string, order: PendingOrder) {
  try {
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': order.id,
        'X-Client-Request-Id': order.id,
      },
      body: JSON.stringify(order.payload),
    });

    return classifyOrderResponse(response);
  } catch {
    return {
      ok: false,
      errorType: 'network' as const,
      message: 'Network error',
    };
  }
}

export function useOrderQueueProcessor({ baseUrl }: OrderQueueProcessorOptions) {
  const { isOnline } = useNetworkStatus();
  const { pendingOrders, updateStatus, incrementAttempt, removeOrder, setError, clearError } =
    useOrderQueueStore();
  const isProcessing = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || !isOnline) {
      return;
    }

    const pending = pendingOrders.filter((order) => order.status === 'pending');
    if (pending.length === 0) {
      return;
    }

    isProcessing.current = true;

    for (const order of pending) {
      const nextAttempt = order.attemptCount + 1;
      if (nextAttempt > MAX_RETRY_ATTEMPTS) {
        updateStatus(order.id, 'failed');
        setError(order.id, 'server', 'Max retry attempts reached');
        continue;
      }

      updateStatus(order.id, 'sending');
      clearError(order.id);
      incrementAttempt(order.id);

      logger.info('Order retry', {
        requestId: order.id,
        metadata: { attempt: nextAttempt },
      });

      const result = await submitOrder(baseUrl, order);

      if (result.ok) {
        logger.info('Order sent', { requestId: order.id });
        removeOrder(order.id);
        continue;
      }

      if (result.errorType === 'validation') {
        updateStatus(order.id, 'failed');
        setError(order.id, 'validation', result.message);
        logger.warn('Order validation failed', {
          requestId: order.id,
          errorCode: 'validation',
        });
        continue;
      }

      if (result.errorType === 'server') {
        setError(order.id, 'server', result.message);
        if (nextAttempt >= MAX_RETRY_ATTEMPTS) {
          updateStatus(order.id, 'failed');
          logger.warn('Order retry exhausted', { requestId: order.id, errorCode: 'server' });
          continue;
        }
      }

      if (result.errorType === 'network') {
        setError(order.id, 'network', result.message);
        logger.warn('Order retry deferred (network)', {
          requestId: order.id,
          errorCode: 'network',
        });
      }

      updateStatus(order.id, 'pending');
      const delay = RETRY_DELAYS[Math.min(order.attemptCount, RETRY_DELAYS.length - 1)];
      await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
    }

    isProcessing.current = false;
  }, [
    baseUrl,
    clearError,
    incrementAttempt,
    isOnline,
    pendingOrders,
    removeOrder,
    setError,
    updateStatus,
  ]);

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return { isOnline, processQueue };
}
