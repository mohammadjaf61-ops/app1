import { useCallback, useEffect, useRef } from 'react';

import { API_BASE_URL } from '../lib/constants';
import { useNetworkStatus } from './use-network';
import { CartMutation, useCartSyncStore } from '../stores/cart-sync-store';

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000];

async function submitCartMutation(mutation: CartMutation): Promise<boolean> {
  try {
    if (mutation.type === 'add') {
      const response = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation.payload),
      });

      if (response.ok) {
        return true;
      }

      if (response.status >= 400 && response.status < 500) {
        return true;
      }

      return false;
    }
  } catch {
    return false;
  }

  return true;
}

export function useCartSyncProcessor() {
  const isConnected = useNetworkStatus();
  const { pendingMutations, updateStatus, incrementAttempt, removeMutation } = useCartSyncStore();
  const isProcessing = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || !isConnected) return;

    const pending = pendingMutations.filter((m) => m.status === 'pending');
    if (pending.length === 0) return;

    isProcessing.current = true;

    for (const mutation of pending) {
      if (mutation.attemptCount >= MAX_RETRY_ATTEMPTS) {
        updateStatus(mutation.id, 'failed');
        continue;
      }

      updateStatus(mutation.id, 'sending');
      incrementAttempt(mutation.id);

      const success = await submitCartMutation(mutation);

      if (success) {
        removeMutation(mutation.id);
      } else {
        const delay = RETRY_DELAYS[Math.min(mutation.attemptCount, RETRY_DELAYS.length - 1)];
        await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
        updateStatus(mutation.id, 'pending');
      }
    }

    isProcessing.current = false;
  }, [isConnected, incrementAttempt, pendingMutations, removeMutation, updateStatus]);

  useEffect(() => {
    if (isConnected) {
      processQueue();
    }
  }, [isConnected, processQueue]);

  return { isConnected, processQueue };
}
