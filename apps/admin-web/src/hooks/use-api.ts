import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

// Query keys
export const queryKeys = {
  // Dashboard
  dashboardStats: ['dashboard', 'stats'],
  dailySales: (from: string, to: string) => ['dashboard', 'daily-sales', from, to],

  // Orders
  orders: (filters?: Record<string, unknown>) => ['orders', filters],
  order: (id: string) => ['orders', id],

  // Inventory
  inventory: (filters?: Record<string, unknown>) => ['inventory', filters],
  inventoryItem: (id: string) => ['inventory', id],
  locations: ['inventory', 'locations'],
  lowStock: ['inventory', 'low-stock'],
  nearExpiry: ['inventory', 'near-expiry'],

  // Catalog
  categories: ['categories'],
  category: (id: string) => ['categories', id],
  products: (filters?: Record<string, unknown>) => ['products', filters],
  product: (id: string) => ['products', id],

  // Delivery
  deliveries: (filters?: Record<string, unknown>) => ['deliveries', filters],
  delivery: (id: string) => ['deliveries', id],
  driverQueue: (driverId: string) => ['deliveries', 'driver', driverId],

  // Users
  users: (filters?: Record<string, unknown>) => ['users', filters],
  user: (id: string) => ['users', id],

  // Reports
  salesSummary: (params?: Record<string, unknown>) => ['reports', 'sales-summary', params],
  stockAging: ['reports', 'stock-aging'],
  categoryPerformance: (params?: Record<string, unknown>) => ['reports', 'category-performance', params],
  driverPerformance: (params?: Record<string, unknown>) => ['reports', 'driver-performance', params],
};

// Types
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => apiClient.get('/reports/sales/summary'),
  });
}

// Order hooks
export function useOrders(filters?: { status?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery({
    queryKey: queryKeys.orders(filters),
    queryFn: () => apiClient.get(`/orders?${params.toString()}`),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => apiClient.get(`/orders/${id}`),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Inventory hooks
export function useInventory(filters?: { page?: number; limit?: number; lowStock?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.lowStock) params.set('lowStock', 'true');

  return useQuery({
    queryKey: queryKeys.inventory(filters),
    queryFn: () => apiClient.get(`/inventory?${params.toString()}`),
  });
}

export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations,
    queryFn: () => apiClient.get('/inventory/locations'),
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: queryKeys.lowStock,
    queryFn: () => apiClient.get('/inventory/low-stock'),
  });
}

export function useNearExpiryItems() {
  return useQuery({
    queryKey: queryKeys.nearExpiry,
    queryFn: () => apiClient.get('/inventory/near-expiry'),
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.patch(`/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// Catalog hooks
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiClient.get('/catalog/categories'),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: () => apiClient.get(`/catalog/categories/${id}`),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => apiClient.post('/catalog/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.patch(`/catalog/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useProducts(filters?: { categoryId?: string; page?: number; limit?: number; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.search) params.set('search', filters.search);

  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => apiClient.get(`/catalog/products?${params.toString()}`),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => apiClient.get(`/catalog/products/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => apiClient.post('/catalog/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.patch(`/catalog/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Delivery hooks
export function useDeliveries(filters?: { status?: string; driverId?: string; page?: number }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.driverId) params.set('driverId', filters.driverId);
  if (filters?.page) params.set('page', String(filters.page));

  return useQuery({
    queryKey: queryKeys.deliveries(filters),
    queryFn: () => apiClient.get(`/delivery?${params.toString()}`),
  });
}

export function useAssignDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
      apiClient.post(`/delivery/assign/${orderId}`, { driverId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// User hooks
export function useUsers(filters?: { role?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.role) params.set('role', filters.role);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery({
    queryKey: queryKeys.users(filters),
    queryFn: () => apiClient.get(`/users?${params.toString()}`),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => apiClient.get(`/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => apiClient.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Report hooks
export function useSalesSummary(params?: { dateFrom?: string; dateTo?: string; categoryId?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);

  return useQuery({
    queryKey: queryKeys.salesSummary(params),
    queryFn: () => apiClient.get(`/reports/sales/summary?${searchParams.toString()}`),
  });
}

export function useStockAging() {
  return useQuery({
    queryKey: queryKeys.stockAging,
    queryFn: () => apiClient.get('/reports/stock/aging'),
  });
}

export function useCategoryPerformance(params?: { dateFrom?: string; dateTo?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.set('dateTo', params.dateTo);

  return useQuery({
    queryKey: queryKeys.categoryPerformance(params),
    queryFn: () => apiClient.get(`/reports/category/performance?${searchParams.toString()}`),
  });
}
