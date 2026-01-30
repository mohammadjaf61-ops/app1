/**
 * Sync Queue for offline operations
 * Queues operations when offline, replays when online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { isOnline, subscribeNetworkStatus } from '@/lib/network';
import { apiClient } from '@/services/api-client';

// Operation types
export type QueueOperationType =
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'SET_QTY'
  | 'SUBMIT_ORDER';

export interface QueueOperation {
  id: string;
  type: QueueOperationType;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface DraftOrder {
  id: string;
  items: Array<{
    productId: string;
    sku: string;
    nameAr: string;
    price: number;
    quantity: number;
  }>;
  deliveryAddress: string;
  notes: string;
  total: number;
  createdAt: number;
}

interface SyncQueueState {
  queue: QueueOperation[];
  draftOrders: DraftOrder[];
  isProcessing: boolean;
  lastSyncAt: number | null;

  // Actions
  enqueue: (type: QueueOperationType, payload: Record<string, unknown>) => void;
  saveDraftOrder: (draft: Omit<DraftOrder, 'id' | 'createdAt'>) => string;
  removeDraftOrder: (id: string) => void;
  getDraftOrders: () => DraftOrder[];
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}

const STORAGE_KEY = 'sync-queue';
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useSyncQueue = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      draftOrders: [],
      isProcessing: false,
      lastSyncAt: null,

      enqueue: (type, payload) => {
        const operation: QueueOperation = {
          id: generateId(),
          type,
          payload,
          createdAt: Date.now(),
          retryCount: 0,
        };

        if (__DEV__) {
          console.debug(`[SyncQueue] Enqueued: ${type}`, payload);
        }

        set((state) => ({
          queue: [...state.queue, operation],
        }));

        // Try to process immediately if online
        if (isOnline()) {
          get().processQueue();
        }
      },

      saveDraftOrder: (draft) => {
        const id = generateId();
        const draftOrder: DraftOrder = {
          ...draft,
          id,
          createdAt: Date.now(),
        };

        if (__DEV__) {
          console.debug(`[SyncQueue] Draft order saved: ${id}`);
        }

        set((state) => ({
          draftOrders: [...state.draftOrders, draftOrder],
        }));

        return id;
      },

      removeDraftOrder: (id) => {
        set((state) => ({
          draftOrders: state.draftOrders.filter((d) => d.id !== id),
        }));
      },

      getDraftOrders: () => get().draftOrders,

      processQueue: async () => {
        const state = get();

        if (state.isProcessing || state.queue.length === 0 || !isOnline()) {
          return;
        }

        set({ isProcessing: true });

        if (__DEV__) {
          console.debug(`[SyncQueue] Processing ${state.queue.length} operations`);
        }

        const queue = [...state.queue];
        const processedIds: string[] = [];
        const failedOperations: QueueOperation[] = [];

        for (const operation of queue) {
          try {
            await processOperation(operation);
            processedIds.push(operation.id);

            if (__DEV__) {
              console.debug(`[SyncQueue] Success: ${operation.type} (${operation.id})`);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Check for permanent failures (auth errors)
            if (isPermanentFailure(error)) {
              if (__DEV__) {
                console.debug(
                  `[SyncQueue] Permanent failure, removing: ${operation.type}`,
                  errorMessage,
                );
              }
              processedIds.push(operation.id);
              continue;
            }

            // Transient error - retry with backoff
            if (operation.retryCount < MAX_RETRIES) {
              failedOperations.push({
                ...operation,
                retryCount: operation.retryCount + 1,
                lastError: errorMessage,
              });

              if (__DEV__) {
                console.debug(
                  `[SyncQueue] Retry ${operation.retryCount + 1}/${MAX_RETRIES}: ${operation.type}`,
                );
              }
            } else {
              // Max retries reached, give up
              if (__DEV__) {
                console.debug(`[SyncQueue] Max retries reached, removing: ${operation.type}`);
              }
              processedIds.push(operation.id);
            }
          }
        }

        // Update queue: remove processed, keep failed for retry
        set((state) => ({
          queue: [
            ...state.queue.filter(
              (op) => !processedIds.includes(op.id) && !failedOperations.find((f) => f.id === op.id),
            ),
            ...failedOperations,
          ],
          isProcessing: false,
          lastSyncAt: Date.now(),
        }));

        // Process draft orders if any
        await processDraftOrders(get, set);
      },

      clearQueue: () => {
        set({ queue: [], draftOrders: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        queue: state.queue,
        draftOrders: state.draftOrders,
        lastSyncAt: state.lastSyncAt,
      }),
    },
  ),
);

// Process a single operation
async function processOperation(operation: QueueOperation): Promise<void> {
  const backoff = BACKOFF_BASE_MS * Math.pow(2, operation.retryCount);

  if (operation.retryCount > 0) {
    await sleep(backoff);
  }

  switch (operation.type) {
    case 'ADD_ITEM':
    case 'REMOVE_ITEM':
    case 'SET_QTY':
      // Cart operations are local-only, no API call needed
      // They're already persisted in cart-store
      return;

    case 'SUBMIT_ORDER':
      // This would be handled by processDraftOrders
      return;

    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }
}

// Process draft orders when back online
async function processDraftOrders(
  get: () => SyncQueueState,
  set: (partial: Partial<SyncQueueState> | ((state: SyncQueueState) => Partial<SyncQueueState>)) => void,
): Promise<void> {
  const drafts = get().draftOrders;

  if (drafts.length === 0 || !isOnline()) {
    return;
  }

  if (__DEV__) {
    console.debug(`[SyncQueue] Processing ${drafts.length} draft orders`);
  }

  for (const draft of drafts) {
    try {
      await apiClient.post('/orders', {
        items: draft.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryAddress: draft.deliveryAddress,
        notes: draft.notes,
      });

      // Remove draft on success
      set((state) => ({
        draftOrders: state.draftOrders.filter((d) => d.id !== draft.id),
      }));

      if (__DEV__) {
        console.debug(`[SyncQueue] Draft order submitted: ${draft.id}`);
      }
    } catch (error) {
      if (isPermanentFailure(error)) {
        // Remove on permanent failure
        set((state) => ({
          draftOrders: state.draftOrders.filter((d) => d.id !== draft.id),
        }));
      }
      // Keep for retry on transient failures
    }
  }
}

// Check if error is permanent (shouldn't retry)
function isPermanentFailure(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('401') ||
      message.includes('403') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Initialize queue processing on network change
let initialized = false;

export function initSyncQueue(): void {
  if (initialized) return;
  initialized = true;

  subscribeNetworkStatus((online) => {
    if (online) {
      useSyncQueue.getState().processQueue();
    }
  });
}
