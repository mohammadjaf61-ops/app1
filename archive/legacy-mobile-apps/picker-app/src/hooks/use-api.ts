import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { saveOrdersOffline, getOfflineOrders, getOfflineOrder } from '@/lib/database';
import { usePickingStore } from '@/stores/picking-store';

// Query keys
export const queryKeys = {
  assignedOrders: ['assigned-orders'] as const,
  order: (id: string) => ['order', id] as const,
  pickerStats: ['picker-stats'] as const,
};

// Get assigned orders with offline fallback
export function useAssignedOrders() {
  const { isOffline: _isOffline, setOffline } = usePickingStore();

  return useQuery({
    queryKey: queryKeys.assignedOrders,
    queryFn: async () => {
      try {
        const orders = await apiClient.getAssignedOrders();
        // Save for offline access
        await saveOrdersOffline(orders);
        setOffline(false);
        return orders;
      } catch (error: any) {
        if (error.message === 'لا يوجد اتصال بالإنترنت') {
          setOffline(true);
          // Return offline data
          return getOfflineOrders();
        }
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Get single order with offline fallback
export function useOrder(orderId: string) {
  const { isOffline: _isOffline, setOffline } = usePickingStore();

  return useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: async () => {
      try {
        const order = await apiClient.getOrder(orderId);
        setOffline(false);
        return order;
      } catch (error: any) {
        if (error.message === 'لا يوجد اتصال بالإنترنت') {
          setOffline(true);
          return getOfflineOrder(orderId);
        }
        throw error;
      }
    },
    enabled: !!orderId,
  });
}

// Get picker stats
export function usePickerStats() {
  return useQuery({
    queryKey: queryKeys.pickerStats,
    queryFn: () => apiClient.getPickerStats(),
    staleTime: 60000, // 1 minute
  });
}

// Start picking order
export function useStartPicking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => apiClient.startPicking(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignedOrders });
    },
  });
}

// Pick item
export function usePickItem() {
  const queryClient = useQueryClient();
  const { pickItem } = usePickingStore();

  return useMutation({
    mutationFn: async ({ orderId, itemId }: { orderId: string; itemId: string }) => {
      // Optimistic update in store
      pickItem(itemId);
      return apiClient.pickItem(orderId, itemId);
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    },
    onError: (_, { itemId }) => {
      // Revert on error
      const { undoPickItem } = usePickingStore.getState();
      undoPickItem(itemId);
    },
  });
}

// Mark item unavailable
export function useMarkItemUnavailable() {
  const queryClient = useQueryClient();
  const { markUnavailable } = usePickingStore();

  return useMutation({
    mutationFn: async ({
      orderId,
      itemId,
      reason,
      notes,
    }: {
      orderId: string;
      itemId: string;
      reason: string;
      notes?: string;
    }) => {
      // Optimistic update in store
      markUnavailable(itemId, reason, notes);
      return apiClient.markItemUnavailable(orderId, itemId, reason, notes);
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    },
    onError: (_, { itemId }) => {
      // Revert on error
      const { undoPickItem } = usePickingStore.getState();
      undoPickItem(itemId);
    },
  });
}

// Complete order picking
export function useCompleteOrder() {
  const queryClient = useQueryClient();
  const { clearSession } = usePickingStore();

  return useMutation({
    mutationFn: (orderId: string) => apiClient.completeOrder(orderId),
    onSuccess: () => {
      clearSession();
      queryClient.invalidateQueries({ queryKey: queryKeys.assignedOrders });
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
