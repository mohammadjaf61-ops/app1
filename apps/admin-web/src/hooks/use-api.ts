import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

// Query keys
export const queryKeys = {
  // Dashboard / Admin
  dashboardStats: ['dashboard', 'stats'],
  adminKpis: ['admin', 'kpis'],
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
  categoryPerformance: (params?: Record<string, unknown>) => [
    'reports',
    'category-performance',
    params,
  ],
  driverPerformance: (params?: Record<string, unknown>) => [
    'reports',
    'driver-performance',
    params,
  ],

  // Permissions & Roles
  permissions: ['permissions'],
  permissionsGrouped: ['permissions', 'grouped'],
  roles: ['permissions', 'roles'],
  role: (id: string) => ['permissions', 'roles', id],

  // AI Insights (PR#24)
  insights: ['analytics', 'insights'],
  insightsStatus: ['analytics', 'insights', 'status'],
};

// Dashboard / Admin hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => apiClient.get('/reports/sales/summary'),
  });
}

export interface AdminKPIs {
  totalOrdersToday: number;
  revenueToday: number;
  pendingOrders: number;
  outOfStockCount: number;
}

export function useAdminKPIs() {
  return useQuery<AdminKPIs>({
    queryKey: queryKeys.adminKpis,
    queryFn: () => apiClient.get<AdminKPIs>('/admin/kpis'),
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

// Order hooks
export function useOrders(filters?: { status?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.status) {
    params.set('status', filters.status);
  }
  if (filters?.page) {
    params.set('page', String(filters.page));
  }
  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }

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

export function useAssignPicker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, pickerId }: { orderId: string; pickerId: string }) =>
      apiClient.patch(`/orders/${orderId}/assign-picker`, { pickerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Inventory hooks
export function useInventory(filters?: { page?: number; limit?: number; lowStock?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.page) {
    params.set('page', String(filters.page));
  }
  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }
  if (filters?.lowStock) {
    params.set('lowStock', 'true');
  }

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

export function useProducts(filters?: {
  categoryId?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.categoryId) {
    params.set('categoryId', filters.categoryId);
  }
  if (filters?.page) {
    params.set('page', String(filters.page));
  }
  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }
  if (filters?.search) {
    params.set('search', filters.search);
  }

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
  if (filters?.status) {
    params.set('status', filters.status);
  }
  if (filters?.driverId) {
    params.set('driverId', filters.driverId);
  }
  if (filters?.page) {
    params.set('page', String(filters.page));
  }

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
  if (filters?.role) {
    params.set('role', filters.role);
  }
  if (filters?.page) {
    params.set('page', String(filters.page));
  }
  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }

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
export function useSalesSummary(params?: {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.dateFrom) {
    searchParams.set('dateFrom', params.dateFrom);
  }
  if (params?.dateTo) {
    searchParams.set('dateTo', params.dateTo);
  }
  if (params?.categoryId) {
    searchParams.set('categoryId', params.categoryId);
  }

  return useQuery({
    queryKey: queryKeys.salesSummary(params),
    queryFn: () => apiClient.get(`/reports/sales/summary?${searchParams.toString()}`),
  });
}

export function useSalesReport(params?: { dateFrom?: string; dateTo?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.dateFrom) {
    searchParams.set('dateFrom', params.dateFrom);
  }
  if (params?.dateTo) {
    searchParams.set('dateTo', params.dateTo);
  }

  return useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: () => apiClient.get(`/reports/sales?${searchParams.toString()}`),
  });
}

export function useTopProducts(params?: {
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'quantity' | 'revenue';
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.dateFrom) {
    searchParams.set('dateFrom', params.dateFrom);
  }
  if (params?.dateTo) {
    searchParams.set('dateTo', params.dateTo);
  }
  if (params?.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params?.limit) {
    searchParams.set('limit', String(params.limit));
  }

  return useQuery({
    queryKey: ['reports', 'top-products', params],
    queryFn: () => apiClient.get(`/reports/top-products?${searchParams.toString()}`),
  });
}

export function useInventoryStatus() {
  return useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: () => apiClient.get('/reports/inventory'),
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
  if (params?.dateFrom) {
    searchParams.set('dateFrom', params.dateFrom);
  }
  if (params?.dateTo) {
    searchParams.set('dateTo', params.dateTo);
  }

  return useQuery({
    queryKey: queryKeys.categoryPerformance(params),
    queryFn: () => apiClient.get(`/reports/category/performance?${searchParams.toString()}`),
  });
}

// Permissions & Roles hooks
export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.permissions,
    queryFn: () => apiClient.get('/permissions'),
  });
}

export function usePermissionsGrouped() {
  return useQuery({
    queryKey: queryKeys.permissionsGrouped,
    queryFn: () => apiClient.get('/permissions/grouped'),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: () => apiClient.get('/permissions/roles'),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: queryKeys.role(id),
    queryFn: () => apiClient.get(`/permissions/roles/${id}`),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      nameAr: string;
      nameEn?: string;
      description?: string;
      permissionIds: string[];
    }) => apiClient.post('/permissions/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { nameAr?: string; nameEn?: string; description?: string; permissionIds?: string[] };
    }) => apiClient.put(`/permissions/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/permissions/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; roleId: string }) =>
      apiClient.post('/permissions/users/assign', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiClient.delete(`/permissions/users/${userId}/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// AI Insights hooks (PR#24)
export interface Insight {
  id: string;
  type: 'STAGNANT_PRODUCTS' | 'PEAK_HOURS' | 'HIGH_CANCELLATION' | 'LOW_STOCK_VELOCITY';
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  explanation: {
    reason: string;
    reasonAr: string;
    dataSource: string;
    periodDays: number;
    methodology: string;
  };
  data: unknown;
  severity: 'info' | 'warning' | 'critical';
  generatedAt: string;
}

export function useInsights() {
  return useQuery<Insight[]>({
    queryKey: queryKeys.insights,
    queryFn: () => apiClient.get<Insight[]>('/analytics/insights'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInsightsStatus() {
  return useQuery<{ enabled: boolean }>({
    queryKey: queryKeys.insightsStatus,
    queryFn: () => apiClient.get<{ enabled: boolean }>('/analytics/insights/status'),
  });
}
