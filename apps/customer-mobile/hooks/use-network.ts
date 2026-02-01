import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState, useCallback, useRef } from 'react';

import { API_BASE_URL } from '../lib/constants';
import { useOrderQueueStore, PendingOrder } from '../stores/order-queue-store';

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000];

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
}

export function useOrderQueueProcessor() {
  const isConnected = useNetworkStatus();
  const { pendingOrders, updateStatus, incrementAttempt, removeOrder } = useOrderQueueStore();
  const isProcessing = useRef(false);

  const submitOrder = useCallback(async (order: PendingOrder): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order.payload),
      });

      if (response.ok) {
        return true;
      }

      // Handle specific error codes - client errors (4xx) should not be retried
      if (response.status >= 400 && response.status < 500) {
        return true; // Mark as complete to stop retrying
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || !isConnected) return;

    const pending = pendingOrders.filter((o) => o.status === 'pending');
    if (pending.length === 0) return;

    isProcessing.current = true;

    for (const order of pending) {
      if (order.attemptCount >= MAX_RETRY_ATTEMPTS) {
        updateStatus(order.id, 'failed');
        continue;
      }

      updateStatus(order.id, 'sending');
      incrementAttempt(order.id);

      const success = await submitOrder(order);

      if (success) {
        removeOrder(order.id);
      } else {
        // Wait before next attempt
        const delay = RETRY_DELAYS[Math.min(order.attemptCount, RETRY_DELAYS.length - 1)];
        await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
        updateStatus(order.id, 'pending');
      }
    }

    isProcessing.current = false;
  }, [isConnected, pendingOrders, updateStatus, incrementAttempt, removeOrder, submitOrder]);

  // Process queue when network becomes available
  useEffect(() => {
    if (isConnected) {
      processQueue();
    }
  }, [isConnected, processQueue]);

  return { isConnected, processQueue };
}
