import { useCallback, useEffect, useRef } from 'react';

import type { CartMutation } from '../stores/cartSyncStore';
import { useCartSyncStore } from '../stores/cartSyncStore';
import { createLogger } from '../utils/logger';

import { useNetworkStatus } from './useNetworkStatus';

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000];

interface CartSyncProcessorOptions {
  baseUrl: string;
}

const logger = createLogger({ scope: 'CartSync', enabled: __DEV__ });

async function submitCartMutation(baseUrl: string, mutation: CartMutation): Promise<boolean> {
  try {
    if (mutation.type !== 'add') {
      return true;
    }

    const response = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mutation.payload),
    });

    return response.ok || (response.status >= 400 && response.status < 500);
  } catch {
    return false;
  }
}

export function useCartSyncProcessor({ baseUrl }: CartSyncProcessorOptions) {
  const { isOnline } = useNetworkStatus();
  const { pendingMutations, updateStatus, incrementAttempt, removeMutation } = useCartSyncStore();
  const isProcessing = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || !isOnline) {
      return;
    }

    const pending = pendingMutations.filter((mutation) => mutation.status === 'pending');
    if (pending.length === 0) {
      return;
    }

    isProcessing.current = true;

    for (const mutation of pending) {
      if (mutation.attemptCount >= MAX_RETRY_ATTEMPTS) {
        updateStatus(mutation.id, 'failed');
        continue;
      }

      updateStatus(mutation.id, 'sending');
      incrementAttempt(mutation.id);

      logger.info('Cart mutation retry', { requestId: mutation.id });

      const success = await submitCartMutation(baseUrl, mutation);

      if (success) {
        removeMutation(mutation.id);
      } else {
        const delay = RETRY_DELAYS[Math.min(mutation.attemptCount, RETRY_DELAYS.length - 1)];
        await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
        updateStatus(mutation.id, 'pending');
      }
    }

    isProcessing.current = false;
  }, [baseUrl, incrementAttempt, isOnline, pendingMutations, removeMutation, updateStatus]);

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return { isOnline, processQueue };
}
