import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createLogger } from '../utils/logger';

export type OrderErrorType = 'network' | 'server' | 'validation';

export interface PendingOrder {
  id: string;
  payload: {
    customerName: string;
    customerPhone: string;
    deliveryAddressText: string;
    deliveryZoneId: string;
    notes?: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  };
  createdAt: number;
  attemptCount: number;
  lastAttemptAt: number | null;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  lastErrorType?: OrderErrorType;
  lastErrorMessage?: string;
  lastErrorAt?: number;
}

interface OrderQueueState {
  pendingOrders: PendingOrder[];

  addOrder: (
    payload: PendingOrder['payload'],
    options?: { id?: string; status?: PendingOrder['status'] },
  ) => string;
  updateStatus: (id: string, status: PendingOrder['status']) => void;
  incrementAttempt: (id: string) => void;
  setError: (id: string, type: OrderErrorType, message?: string) => void;
  clearError: (id: string) => void;
  retryOrder: (id: string) => void;
  removeOrder: (id: string) => void;
  getPendingCount: () => number;
}

export function createOrderId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const logger = createLogger({ scope: 'OrderQueueStore', enabled: __DEV__ });

export const useOrderQueueStore = create<OrderQueueState>()(
  persist(
    (set, get) => ({
      pendingOrders: [],

      addOrder: (payload, options) => {
        const id = options?.id ?? createOrderId();
        const order: PendingOrder = {
          id,
          payload,
          createdAt: Date.now(),
          attemptCount: 0,
          lastAttemptAt: null,
          status: options?.status ?? 'pending',
          lastErrorType: undefined,
          lastErrorMessage: undefined,
          lastErrorAt: undefined,
        };
        set((state) => ({
          pendingOrders: [...state.pendingOrders, order],
        }));
        logger.info('Order queued', { requestId: id });
        return id;
      },

      updateStatus: (id, status) => {
        set((state) => ({
          pendingOrders: state.pendingOrders.map((order) =>
            order.id === id ? { ...order, status } : order,
          ),
        }));
      },

      incrementAttempt: (id) => {
        set((state) => ({
          pendingOrders: state.pendingOrders.map((order) => {
            if (order.id !== id) {
              return order;
            }
            return {
              ...order,
              attemptCount: order.attemptCount + 1,
              lastAttemptAt: Date.now(),
            };
          }),
        }));
      },

      setError: (id, type, message) => {
        set((state) => ({
          pendingOrders: state.pendingOrders.map((order) => {
            if (order.id !== id) {
              return order;
            }
            return {
              ...order,
              lastErrorType: type,
              lastErrorMessage: message,
              lastErrorAt: Date.now(),
            };
          }),
        }));
      },

      clearError: (id) => {
        set((state) => ({
          pendingOrders: state.pendingOrders.map((order) => {
            if (order.id !== id) {
              return order;
            }
            return {
              ...order,
              lastErrorType: undefined,
              lastErrorMessage: undefined,
              lastErrorAt: undefined,
            };
          }),
        }));
      },

      retryOrder: (id) => {
        set((state) => ({
          pendingOrders: state.pendingOrders.map((order) => {
            if (order.id !== id) {
              return order;
            }
            return {
              ...order,
              status: 'pending',
              attemptCount: 0,
              lastAttemptAt: null,
              lastErrorType: undefined,
              lastErrorMessage: undefined,
              lastErrorAt: undefined,
            };
          }),
        }));
      },

      removeOrder: (id) => {
        set((state) => ({
          pendingOrders: state.pendingOrders.filter((order) => order.id !== id),
        }));
        logger.info('Order removed from queue', { requestId: id });
      },

      getPendingCount: () => {
        return get().pendingOrders.filter(
          (order) => order.status === 'pending' || order.status === 'sending',
        ).length;
      },
    }),
    {
      name: 'order-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
