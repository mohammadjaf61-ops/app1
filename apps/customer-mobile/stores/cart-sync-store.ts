import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartMutationType = 'add';

export interface CartMutationPayload {
  productId: string;
  sku: string;
  quantity: number;
}

export interface CartMutation {
  id: string;
  type: CartMutationType;
  payload: CartMutationPayload;
  status: 'pending' | 'sending' | 'failed';
  attemptCount: number;
  createdAt: number;
}

interface CartSyncState {
  pendingMutations: CartMutation[];
  enqueueAdd: (payload: CartMutationPayload) => void;
  updateStatus: (id: string, status: CartMutation['status']) => void;
  incrementAttempt: (id: string) => void;
  removeMutation: (id: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const useCartSyncStore = create<CartSyncState>()(
  persist(
    (set) => ({
      pendingMutations: [],
      enqueueAdd: (payload) => {
        const mutation: CartMutation = {
          id: generateId(),
          type: 'add',
          payload,
          status: 'pending',
          attemptCount: 0,
          createdAt: Date.now(),
        };
        set((state) => ({
          pendingMutations: [...state.pendingMutations, mutation],
        }));
      },
      updateStatus: (id, status) => {
        set((state) => ({
          pendingMutations: state.pendingMutations.map((mutation) =>
            mutation.id === id ? { ...mutation, status } : mutation,
          ),
        }));
      },
      incrementAttempt: (id) => {
        set((state) => ({
          pendingMutations: state.pendingMutations.map((mutation) =>
            mutation.id === id ? { ...mutation, attemptCount: mutation.attemptCount + 1 } : mutation,
          ),
        }));
      },
      removeMutation: (id) => {
        set((state) => ({
          pendingMutations: state.pendingMutations.filter((mutation) => mutation.id !== id),
        }));
      },
    }),
    {
      name: 'cart-sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pendingMutations: state.pendingMutations,
      }),
    },
  ),
);
