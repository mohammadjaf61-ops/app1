import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

import { fetchProducts, fetchFeaturedProducts, fetchCategories, Product, Category } from '../lib/api';
import { CACHE_KEYS, CACHE_TTLS, isCacheExpired, readCache, writeCache } from '../lib/cache';
import { QUERY_KEYS } from '../lib/constants';
import { markProductsCached, markProductsNetworkUpdate } from '../lib/performance';

interface CachedQueryConfig<T> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
  cacheKey: string;
  ttlMs: number;
  onCachedData?: () => void;
  onNetworkData?: () => void;
}

function useCachedQuery<T>({
  queryKey,
  queryFn,
  cacheKey,
  ttlMs,
  onCachedData,
  onNetworkData,
}: CachedQueryConfig<T>) {
  const queryClient = useQueryClient();
  const [shouldFetch, setShouldFetch] = useState(false);
  const cacheChecked = useRef(false);

  useEffect(() => {
    if (cacheChecked.current) return;
    cacheChecked.current = true;

    let isActive = true;

    readCache<T>(cacheKey).then((entry) => {
      if (!isActive) return;
      if (entry) {
        queryClient.setQueryData(queryKey, entry.value);
        onCachedData?.();
        setShouldFetch(isCacheExpired(entry, ttlMs));
        return;
      }
      setShouldFetch(true);
    });

    return () => {
      isActive = false;
    };
  }, [cacheKey, onCachedData, queryClient, queryKey, ttlMs]);

  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const data = await queryFn();
      await writeCache(cacheKey, data);
      onNetworkData?.();
      return data;
    },
    staleTime: ttlMs,
    placeholderData: (prev) => prev,
    enabled: shouldFetch,
    refetchOnMount: false,
  });
}

export function useProducts(categoryId?: string) {
  return useCachedQuery<Product[]>({
    queryKey: QUERY_KEYS.products({ categoryId }),
    queryFn: () => fetchProducts(categoryId),
    cacheKey: CACHE_KEYS.products(categoryId),
    ttlMs: CACHE_TTLS.homeFeed,
  });
}

export function useFeaturedProducts() {
  return useCachedQuery<Product[]>({
    queryKey: ['products', 'featured'],
    queryFn: fetchFeaturedProducts,
    cacheKey: CACHE_KEYS.featuredProducts,
    ttlMs: CACHE_TTLS.featuredProducts,
    onCachedData: markProductsCached,
    onNetworkData: markProductsNetworkUpdate,
  });
}

export function useCategories() {
  return useCachedQuery<Category[]>({
    queryKey: QUERY_KEYS.categories,
    queryFn: fetchCategories,
    cacheKey: CACHE_KEYS.categories,
    ttlMs: CACHE_TTLS.categories,
  });
}

export function usePrefetchOnMount() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let isActive = true;

    const prefetch = async () => {
      const [categoriesCache, featuredCache] = await Promise.all([
        readCache<Category[]>(CACHE_KEYS.categories),
        readCache<Product[]>(CACHE_KEYS.featuredProducts),
      ]);
      if (!isActive) return;

      const fetches: Promise<unknown>[] = [];

      if (!categoriesCache || isCacheExpired(categoriesCache, CACHE_TTLS.categories)) {
        fetches.push(
          queryClient.fetchQuery({
            queryKey: QUERY_KEYS.categories,
            queryFn: async () => {
              const data = await fetchCategories();
              await writeCache(CACHE_KEYS.categories, data);
              return data;
            },
            staleTime: CACHE_TTLS.categories,
          }),
        );
      }

      if (!featuredCache || isCacheExpired(featuredCache, CACHE_TTLS.featuredProducts)) {
        fetches.push(
          queryClient.fetchQuery({
            queryKey: ['products', 'featured'],
            queryFn: async () => {
              const data = await fetchFeaturedProducts();
              await writeCache(CACHE_KEYS.featuredProducts, data);
              return data;
            },
            staleTime: CACHE_TTLS.featuredProducts,
          }),
        );
      }

      if (fetches.length > 0) {
        await Promise.all(fetches);
      }
    };

    const task = InteractionManager.runAfterInteractions(() => {
      prefetch();
    });

    return () => {
      isActive = false;
      task.cancel();
    };
  }, [queryClient]);
}
