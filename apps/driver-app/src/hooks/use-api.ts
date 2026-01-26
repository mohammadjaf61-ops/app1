import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  saveDeliveriesOffline,
  getOfflineDeliveries,
  getOfflineDelivery,
} from '@/lib/database';
import { useDeliveryStore } from '@/stores/delivery-store';
import { FailedDeliveryReason } from '@/lib/constants';

// Query keys
export const queryKeys = {
  assignedDeliveries: ['assigned-deliveries'] as const,
  delivery: (id: string) => ['delivery', id] as const,
  driverStats: ['driver-stats'] as const,
};

// Get assigned deliveries with offline fallback
export function useAssignedDeliveries() {
  const { isOffline, setOffline } = useDeliveryStore();

  return useQuery({
    queryKey: queryKeys.assignedDeliveries,
    queryFn: async () => {
      try {
        const deliveries = await apiClient.getAssignedDeliveries();
        // Save for offline access
        await saveDeliveriesOffline(deliveries);
        setOffline(false);
        return deliveries;
      } catch (error: any) {
        if (error.message === 'لا يوجد اتصال بالإنترنت') {
          setOffline(true);
          // Return offline data
          return getOfflineDeliveries();
        }
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Get single delivery with offline fallback
export function useDelivery(orderId: string) {
  const { isOffline, setOffline } = useDeliveryStore();

  return useQuery({
    queryKey: queryKeys.delivery(orderId),
    queryFn: async () => {
      try {
        const delivery = await apiClient.getDelivery(orderId);
        setOffline(false);
        return delivery;
      } catch (error: any) {
        if (error.message === 'لا يوجد اتصال بالإنترنت') {
          setOffline(true);
          return getOfflineDelivery(orderId);
        }
        throw error;
      }
    },
    enabled: !!orderId,
  });
}

// Get driver stats
export function useDriverStats() {
  return useQuery({
    queryKey: queryKeys.driverStats,
    queryFn: () => apiClient.getDriverStats(),
    staleTime: 60000, // 1 minute
  });
}

// Confirm pickup
export function useConfirmPickup() {
  const queryClient = useQueryClient();
  const { markPickedUp, isOffline } = useDeliveryStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (isOffline) {
        await markPickedUp(orderId);
        return { success: true, offline: true };
      }
      return apiClient.confirmPickup(orderId);
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.delivery(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignedDeliveries });
    },
  });
}

// Start delivery (out for delivery)
export function useStartDelivery() {
  const queryClient = useQueryClient();
  const { markOutForDelivery, isOffline } = useDeliveryStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (isOffline) {
        await markOutForDelivery(orderId);
        return { success: true, offline: true };
      }
      return apiClient.startDelivery(orderId);
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.delivery(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignedDeliveries });
    },
  });
}

// Complete delivery
export function useCompleteDelivery() {
  const queryClient = useQueryClient();
  const { markDelivered, isOffline } = useDeliveryStore();

  return useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes?: string }) => {
      if (isOffline) {
        await markDelivered(orderId, notes);
        return { success: true, offline: true };
      }
      return apiClient.completeDelivery(orderId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignedDeliveries });
      queryClient.invalidateQueries({ queryKey: queryKeys.driverStats });
    },
  });
}

// Fail delivery
export function useFailDelivery() {
  const queryClient = useQueryClient();
  const { markFailed, isOffline } = useDeliveryStore();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
      notes,
    }: {
      orderId: string;
      reason: FailedDeliveryReason;
      notes?: string;
    }) => {
      if (isOffline) {
        await markFailed(orderId, reason, notes);
        return { success: true, offline: true };
      }
      return apiClient.failDelivery(orderId, reason, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignedDeliveries });
      queryClient.invalidateQueries({ queryKey: queryKeys.driverStats });
    },
  });
}

// Auth mutations
export function useRequestOtp() {
  return useMutation({
    mutationFn: (phone: string) => apiClient.requestOtp(phone),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      apiClient.verifyOtp(phone, code),
  });
}
