import { create } from 'zustand';

import { markItemPickedOffline, markItemUnavailableOffline } from '@/lib/database';

interface PickedItem {
  itemId: string;
  pickedAt: string;
}

interface UnavailableItem {
  itemId: string;
  reason: string;
  notes?: string;
  markedAt: string;
}

interface PickingState {
  // Current picking session
  currentOrderId: string | null;
  pickedItems: Record<string, PickedItem>;
  unavailableItems: Record<string, UnavailableItem>;

  // Offline mode
  isOffline: boolean;

  // Actions
  startPicking: (orderId: string) => void;
  pickItem: (itemId: string) => void;
  markUnavailable: (itemId: string, reason: string, notes?: string) => void;
  undoPickItem: (itemId: string) => void;
  clearSession: () => void;
  setOffline: (offline: boolean) => void;

  // Getters
  isItemPicked: (itemId: string) => boolean;
  isItemUnavailable: (itemId: string) => boolean;
  getItemStatus: (itemId: string) => 'pending' | 'picked' | 'unavailable';
  getPickedCount: () => number;
  getUnavailableCount: () => number;
}

export const usePickingStore = create<PickingState>((set, get) => ({
  currentOrderId: null,
  pickedItems: {},
  unavailableItems: {},
  isOffline: false,

  startPicking: (orderId) => {
    set({
      currentOrderId: orderId,
      pickedItems: {},
      unavailableItems: {},
    });
  },

  pickItem: (itemId) => {
    const { currentOrderId, isOffline } = get();

    const pickedItem: PickedItem = {
      itemId,
      pickedAt: new Date().toISOString(),
    };

    set((state) => ({
      pickedItems: {
        ...state.pickedItems,
        [itemId]: pickedItem,
      },
    }));

    // Save offline if needed
    if (isOffline && currentOrderId) {
      markItemPickedOffline(currentOrderId, itemId);
    }
  },

  markUnavailable: (itemId, reason, notes) => {
    const { currentOrderId, isOffline } = get();

    const unavailableItem: UnavailableItem = {
      itemId,
      reason,
      notes,
      markedAt: new Date().toISOString(),
    };

    set((state) => ({
      unavailableItems: {
        ...state.unavailableItems,
        [itemId]: unavailableItem,
      },
    }));

    // Save offline if needed
    if (isOffline && currentOrderId) {
      markItemUnavailableOffline(currentOrderId, itemId, reason, notes);
    }
  },

  undoPickItem: (itemId) => {
    set((state) => {
      const newPicked = { ...state.pickedItems };
      const newUnavailable = { ...state.unavailableItems };
      delete newPicked[itemId];
      delete newUnavailable[itemId];
      return {
        pickedItems: newPicked,
        unavailableItems: newUnavailable,
      };
    });
  },

  clearSession: () => {
    set({
      currentOrderId: null,
      pickedItems: {},
      unavailableItems: {},
    });
  },

  setOffline: (offline) => {
    set({ isOffline: offline });
  },

  isItemPicked: (itemId) => {
    return itemId in get().pickedItems;
  },

  isItemUnavailable: (itemId) => {
    return itemId in get().unavailableItems;
  },

  getItemStatus: (itemId) => {
    const { pickedItems, unavailableItems } = get();
    if (itemId in pickedItems) {
      return 'picked';
    }
    if (itemId in unavailableItems) {
      return 'unavailable';
    }
    return 'pending';
  },

  getPickedCount: () => {
    return Object.keys(get().pickedItems).length;
  },

  getUnavailableCount: () => {
    return Object.keys(get().unavailableItems).length;
  },
}));
