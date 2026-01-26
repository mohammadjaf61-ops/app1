import { create } from 'zustand';
import {
  queueStatusUpdate,
  updateDeliveryStatusOffline,
} from '@/lib/database';
import { FailedDeliveryReason } from '@/lib/constants';

interface DeliveryState {
  // Current delivery session
  currentDeliveryId: string | null;

  // Offline mode
  isOffline: boolean;

  // Actions
  setCurrentDelivery: (deliveryId: string | null) => void;
  setOffline: (offline: boolean) => void;

  // Offline status updates
  markPickedUp: (deliveryId: string) => Promise<void>;
  markOutForDelivery: (deliveryId: string) => Promise<void>;
  markDelivered: (deliveryId: string, notes?: string) => Promise<void>;
  markFailed: (deliveryId: string, reason: FailedDeliveryReason, notes?: string) => Promise<void>;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  currentDeliveryId: null,
  isOffline: false,

  setCurrentDelivery: (deliveryId) => {
    set({ currentDeliveryId: deliveryId });
  },

  setOffline: (offline) => {
    set({ isOffline: offline });
  },

  markPickedUp: async (deliveryId) => {
    const { isOffline } = get();

    if (isOffline) {
      await updateDeliveryStatusOffline(deliveryId, 'READY');
      await queueStatusUpdate(deliveryId, 'PICKUP');
    }
  },

  markOutForDelivery: async (deliveryId) => {
    const { isOffline } = get();

    if (isOffline) {
      await updateDeliveryStatusOffline(deliveryId, 'OUT_FOR_DELIVERY');
      await queueStatusUpdate(deliveryId, 'START_DELIVERY');
    }
  },

  markDelivered: async (deliveryId, notes) => {
    const { isOffline } = get();

    if (isOffline) {
      await updateDeliveryStatusOffline(deliveryId, 'DELIVERED');
      await queueStatusUpdate(deliveryId, 'COMPLETE_DELIVERY', { notes });
    }
  },

  markFailed: async (deliveryId, reason, notes) => {
    const { isOffline } = get();

    if (isOffline) {
      await updateDeliveryStatusOffline(deliveryId, 'FAILED');
      await queueStatusUpdate(deliveryId, 'FAIL_DELIVERY', { reason, notes });
    }
  },
}));
