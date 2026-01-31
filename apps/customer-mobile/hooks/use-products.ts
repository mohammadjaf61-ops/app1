import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { fetchProducts, fetchFeaturedProducts, fetchCategories, Product, Category } from '../lib/api';
import { QUERY_KEYS } from '../lib/constants';

export function useProducts(categoryId?: string) {
  return useQuery<Product[]>({
    queryKey: QUERY_KEYS.products({ categoryId }),
    queryFn: () => fetchProducts(categoryId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (prev) => prev,
  });
}

export function useFeaturedProducts() {
  return useQuery<Product[]>({
    queryKey: ['products', 'featured'],
    queryFn: fetchFeaturedProducts,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: QUERY_KEYS.categories,
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (prev) => prev,
  });
}

export function usePrefetchOnMount() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch categories
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.categories,
      queryFn: fetchCategories,
      staleTime: 10 * 60 * 1000,
    });

    // Prefetch featured products
    queryClient.prefetchQuery({
      queryKey: ['products', 'featured'],
      queryFn: fetchFeaturedProducts,
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}
