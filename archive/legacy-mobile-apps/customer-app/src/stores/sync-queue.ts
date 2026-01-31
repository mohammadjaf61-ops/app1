import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { isOnline, subscribeNetworkStatus } from '@/lib/network';

interface QueuedOperation {
  id: string;
  type: 'order' | 'cart_sync';
  payload: unknown;
  createdAt: number;
  retryCount: number;
}

interface SyncQueueState {
  queue: QueuedOperation[];
  isProcessing: boolean;
  addOperation: (type: QueuedOperation['type'], payload: unknown) => string;
  removeOperation: (id: string) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}

const STORAGE_KEY = 'sync-queue';
const MAX_RETRIES = 3;

function generateId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      addOperation: (type, payload) => {
        const id = generateId();
        const operation: QueuedOperation = {
          id,
          type,
          payload,
          createdAt: Date.now(),
          retryCount: 0,
        };

        set((state) => ({
          queue: [...state.queue, operation],
        }));

        if (isOnline()) {
          get().processQueue();
        }

        return id;
      },

      removeOperation: (id) => {
        set((state) => ({
          queue: state.queue.filter((op) => op.id !== id),
        }));
      },

      processQueue: async () => {
        const state = get();
        if (state.isProcessing || state.queue.length === 0 || !isOnline()) {
          return;
        }

        set({ isProcessing: true });

        for (const operation of state.queue) {
          if (!isOnline()) break;

          try {
            await processOperation(operation);
            get().removeOperation(operation.id);
          } catch {
            if (operation.retryCount >= MAX_RETRIES) {
              get().removeOperation(operation.id);
            } else {
              set((s) => ({
                queue: s.queue.map((op) =>
                  op.id === operation.id
                    ? { ...op, retryCount: op.retryCount + 1 }
                    : op
                ),
              }));
            }
          }
        }

        set({ isProcessing: false });
      },

      clearQueue: () => {
        set({ queue: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ queue: state.queue }),
    }
  )
);

async function processOperation(operation: QueuedOperation): Promise<void> {
  switch (operation.type) {
    case 'order':
      // Process order submission
      break;
    case 'cart_sync':
      // Sync cart with server
      break;
  }
}

export function initSyncQueue(): void {
  subscribeNetworkStatus((online) => {
    if (online) {
      useSyncQueueStore.getState().processQueue();
    }
  });
}
