import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
}

interface OrderQueueState {
  pendingOrders: PendingOrder[];

  addOrder: (payload: PendingOrder['payload']) => string;
  updateStatus: (id: string, status: PendingOrder['status']) => void;
  incrementAttempt: (id: string) => void;
  removeOrder: (id: string) => void;
  getPendingCount: () => number;
}

function generateId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useOrderQueueStore = create<OrderQueueState>()(
  persist(
    (set, get) => ({
      pendingOrders: [],

      addOrder: (payload) => {
        const id = generateId();
        const order: PendingOrder = {
          id,
          payload,
          createdAt: Date.now(),
          attemptCount: 0,
          lastAttemptAt: null,
          status: 'pending',
        };
        set((state) => ({
          pendingOrders: [...state.pendingOrders, order],
        }));
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
          pendingOrders: state.pendingOrders.map((order) =>
            order.id === id
              ? { ...order, attemptCount: order.attemptCount + 1, lastAttemptAt: Date.now() }
              : order,
          ),
        }));
      },

      removeOrder: (id) => {
        set((state) => ({
          pendingOrders: state.pendingOrders.filter((order) => order.id !== id),
        }));
      },

      getPendingCount: () => {
        return get().pendingOrders.filter((o) => o.status === 'pending' || o.status === 'sending')
          .length;
      },
    }),
    {
      name: 'order-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
