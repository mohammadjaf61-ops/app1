import { cacheService, CacheKeys, useNetworkStatus } from '@hypermarket/mobile-core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/lib/constants';
import { apiClient } from '@/services/api-client';

// Types
interface Category {
  id: string;
  nameAr: string;
  descriptionAr?: string;
  imageUrl?: string;
  parentId?: string;
  children?: Category[];
}

interface Product {
  id: string;
  sku: string;
  nameAr: string;
  descriptionAr?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  category?: Category;
  isActive: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  deliveryAddressText: string;
  notes?: string;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

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

// Cache TTL constants
const CACHE_TTL = {
  categories: 24 * 60 * 60 * 1000, // 24 hours
  products: 6 * 60 * 60 * 1000, // 6 hours
  homeOffers: 2 * 60 * 60 * 1000, // 2 hours
  homeRecommended: 2 * 60 * 60 * 1000, // 2 hours
};

// ========== Categories ==========

export function useCategories() {
  const { isOffline } = useNetworkStatus();

  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async () => {
      // Try to fetch from API
      try {
        const data = await apiClient.get<Category[]>('/catalog/categories');
        // Cache the response
        await cacheService.set(CacheKeys.categories(), data, { ttl: CACHE_TTL.categories });
        return data;
      } catch (error) {
        // If offline or error, try cache
        const cached = await cacheService.get<Category[]>(CacheKeys.categories());
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: isOffline ? 0 : 3,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.category(id),
    queryFn: () => apiClient.get<Category>(`/catalog/categories/${id}`),
    enabled: !!id,
  });
}

// ========== Products ==========

export function useProducts(params?: {
  categoryId?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { isOffline } = useNetworkStatus();
  const searchParams = new URLSearchParams();
  if (params?.categoryId) {
    searchParams.set('categoryId', params.categoryId);
  }
  if (params?.page) {
    searchParams.set('page', String(params.page));
  }
  if (params?.limit) {
    searchParams.set('limit', String(params.limit));
  }
  if (params?.search) {
    searchParams.set('search', params.search);
  }

  const cacheKey = CacheKeys.products(params);

  return useQuery({
    queryKey: QUERY_KEYS.products(params),
    queryFn: async () => {
      try {
        const data = await apiClient.get<PaginatedResponse<Product>>(
          `/catalog/products?${searchParams.toString()}`,
        );
        // Cache the response
        await cacheService.set(cacheKey, data, { ttl: CACHE_TTL.products });
        return data;
      } catch (error) {
        // If offline or error, try cache
        const cached = await cacheService.get<PaginatedResponse<Product>>(cacheKey);
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: isOffline ? 0 : 3,
  });
}

export function useProduct(id: string) {
  const { isOffline } = useNetworkStatus();
  const cacheKey = CacheKeys.product(id);

  return useQuery({
    queryKey: QUERY_KEYS.product(id),
    queryFn: async () => {
      try {
        const data = await apiClient.get<Product>(`/catalog/products/${id}`);
        await cacheService.set(cacheKey, data, { ttl: CACHE_TTL.products });
        return data;
      } catch (error) {
        const cached = await cacheService.get<Product>(cacheKey);
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    enabled: !!id,
    retry: isOffline ? 0 : 3,
  });
}

export function useSearchProducts(query: string) {
  const { isOffline } = useNetworkStatus();

  return useQuery({
    queryKey: QUERY_KEYS.searchProducts(query),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Product>>(
        `/catalog/products?search=${encodeURIComponent(query)}&limit=20`,
      ),
    enabled: query.length >= 2 && !isOffline, // Disable search when offline
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ========== Home ==========

export function useHomeOffers() {
  const { isOffline } = useNetworkStatus();
  const cacheKey = CacheKeys.homeOffers();

  return useQuery({
    queryKey: QUERY_KEYS.homeOffers,
    queryFn: async () => {
      try {
        const data = await apiClient.get<Product[]>('/catalog/products?hasOffer=true&limit=10');
        await cacheService.set(cacheKey, data, { ttl: CACHE_TTL.homeOffers });
        return data;
      } catch (error) {
        const cached = await cacheService.get<Product[]>(cacheKey);
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: isOffline ? 0 : 3,
  });
}

export function useHomeRecommended() {
  const { isOffline } = useNetworkStatus();
  const cacheKey = CacheKeys.homeRecommended();

  return useQuery({
    queryKey: QUERY_KEYS.homeRecommended,
    queryFn: async () => {
      try {
        const data = await apiClient.get<Product[]>('/catalog/products?featured=true&limit=10');
        await cacheService.set(cacheKey, data, { ttl: CACHE_TTL.homeRecommended });
        return data;
      } catch (error) {
        const cached = await cacheService.get<Product[]>(cacheKey);
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: isOffline ? 0 : 3,
  });
}

// ========== Orders ==========

export function useOrders() {
  const { isOffline } = useNetworkStatus();

  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: () => apiClient.get<PaginatedResponse<Order>>('/orders/my'),
    enabled: !isOffline, // Orders require online connection
  });
}

export function useOrder(id: string) {
  const { isOffline } = useNetworkStatus();

  return useQuery({
    queryKey: QUERY_KEYS.order(id),
    queryFn: () => apiClient.get<Order>(`/orders/${id}`),
    enabled: !!id && !isOffline,
  });
}

interface CreateOrderData {
  customerName: string;
  customerPhone: string;
  deliveryAddressText: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderData) => apiClient.post<Order>('/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
  });
}

// ========== Profile ==========

export function useProfile() {
  const { isOffline } = useNetworkStatus();

  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: () => apiClient.get('/auth/me'),
    enabled: !isOffline,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { fullName?: string }) => apiClient.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}
