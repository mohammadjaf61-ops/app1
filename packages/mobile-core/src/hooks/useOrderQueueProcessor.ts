import { useCallback, useEffect, useRef } from 'react';

import { processOrderQueue } from '../services/order-queue';
import { useOrderQueueStore } from '../stores/orderQueueStore';
import type { OrderErrorType, PendingOrder } from '../stores/orderQueueStore';
import { createLogger } from '../utils/logger';

import { useNetworkStatus } from './useNetworkStatus';

interface OrderQueueProcessorOptions {
  baseUrl: string;
}

const logger = createLogger({ scope: 'OrderQueue', enabled: __DEV__ });
const REQUEST_TIMEOUT_MS = 10000;

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': order.id,
        'X-Client-Request-Id': order.id,
      },
      body: JSON.stringify(order.payload),
      signal: controller.signal,
    });

    return classifyOrderResponse(response);
  } catch {
    return {
      ok: false,
      errorType: 'network' as const,
      message: 'Network error',
    };
  } finally {
    clearTimeout(timeoutId);
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

    isProcessing.current = true;

    await processOrderQueue({
      isOnline,
      pendingOrders,
      submitOrder: (order) => submitOrder(baseUrl, order),
      actions: {
        updateStatus,
        incrementAttempt,
        removeOrder,
        setError,
        clearError,
      },
      logger,
    });

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
