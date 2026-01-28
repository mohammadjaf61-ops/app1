import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  Product,
  Category,
  Order,
  ProductListResponse,
  OrderListResponse,
  CreateOrderRequest,
} from '@hypermarket/contracts';

import { apiClient } from '@/services/api-client';
import { QUERY_KEYS } from '@/lib/constants';

// ========== Categories ==========

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => apiClient.get<Category[]>('/catalog/categories'),
    staleTime: 1000 * 60 * 10, // 10 minutes - categories don't change often
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
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);

  return useQuery({
    queryKey: QUERY_KEYS.products(params),
    queryFn: () =>
      apiClient.get<ProductListResponse>(
        `/catalog/products?${searchParams.toString()}`
      ),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.product(id),
    queryFn: () => apiClient.get<Product>(`/catalog/products/${id}`),
    enabled: !!id,
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.searchProducts(query),
    queryFn: () =>
      apiClient.get<ProductListResponse>(
        `/catalog/products?search=${encodeURIComponent(query)}&limit=20`
      ),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ========== Home ==========

export function useHomeOffers() {
  return useQuery({
    queryKey: QUERY_KEYS.homeOffers,
    queryFn: () =>
      apiClient.get<Product[]>('/catalog/products?hasOffer=true&limit=10'),
    staleTime: 1000 * 60 * 5,
  });
}

export function useHomeRecommended() {
  return useQuery({
    queryKey: QUERY_KEYS.homeRecommended,
    queryFn: () =>
      apiClient.get<Product[]>('/catalog/products?featured=true&limit=10'),
    staleTime: 1000 * 60 * 5,
  });
}

// ========== Orders ==========

export function useOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: () => apiClient.get<OrderListResponse>('/orders/my'),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.order(id),
    queryFn: () => apiClient.get<Order>(`/orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) =>
      apiClient.post<Order>('/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
  });
}

// ========== Profile ==========

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: () => apiClient.get('/auth/me'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { fullName?: string }) =>
      apiClient.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}
