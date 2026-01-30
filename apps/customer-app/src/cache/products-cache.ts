/**
 * Products Cache Layer
 * Provides instant access to cached products for fast app startup
 * Uses stale-while-revalidate strategy
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product, Category, ProductListResponse } from '@hypermarket/contracts';

const CACHE_KEYS = {
  PRODUCTS: 'cache:products',
  CATEGORIES: 'cache:categories',
  LAST_UPDATE: 'cache:lastUpdate',
} as const;

// Cache duration (24 hours)
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cached products
 * Returns null if cache is empty
 */
export async function getCachedProducts(): Promise<Product[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.PRODUCTS);
    if (!cached) return null;

    const entry: CacheEntry<Product[]> = JSON.parse(cached);
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Get cached categories
 * Returns null if cache is empty
 */
export async function getCachedCategories(): Promise<Category[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES);
    if (!cached) return null;

    const entry: CacheEntry<Category[]> = JSON.parse(cached);
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Save products to cache
 */
export async function cacheProducts(products: Product[]): Promise<void> {
  try {
    const entry: CacheEntry<Product[]> = {
      data: products,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(entry));

    if (__DEV__) {
      console.debug(`[ProductsCache] Cached ${products.length} products`);
    }
  } catch (error) {
    if (__DEV__) {
      console.debug('[ProductsCache] Failed to cache products:', error);
    }
  }
}

/**
 * Save categories to cache
 */
export async function cacheCategories(categories: Category[]): Promise<void> {
  try {
    const entry: CacheEntry<Category[]> = {
      data: categories,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(entry));

    if (__DEV__) {
      console.debug(`[ProductsCache] Cached ${categories.length} categories`);
    }
  } catch (error) {
    if (__DEV__) {
      console.debug('[ProductsCache] Failed to cache categories:', error);
    }
  }
}

/**
 * Check if cache is stale
 */
export async function isCacheStale(): Promise<boolean> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.PRODUCTS);
    if (!cached) return true;

    const entry: CacheEntry<Product[]> = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;

    return age > CACHE_MAX_AGE;
  } catch {
    return true;
  }
}

/**
 * Get cache age in milliseconds
 */
export async function getCacheAge(): Promise<number | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.PRODUCTS);
    if (!cached) return null;

    const entry: CacheEntry<Product[]> = JSON.parse(cached);
    return Date.now() - entry.timestamp;
  } catch {
    return null;
  }
}

/**
 * Clear all cached data
 */
export async function clearProductsCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.PRODUCTS,
      CACHE_KEYS.CATEGORIES,
      CACHE_KEYS.LAST_UPDATE,
    ]);

    if (__DEV__) {
      console.debug('[ProductsCache] Cache cleared');
    }
  } catch (error) {
    if (__DEV__) {
      console.debug('[ProductsCache] Failed to clear cache:', error);
    }
  }
}

/**
 * Preload cache on app startup
 * Returns cached data immediately without waiting for network
 */
export async function preloadCache(): Promise<{
  products: Product[] | null;
  categories: Category[] | null;
}> {
  const [products, categories] = await Promise.all([
    getCachedProducts(),
    getCachedCategories(),
  ]);

  if (__DEV__) {
    console.debug(
      `[ProductsCache] Preloaded: ${products?.length ?? 0} products, ${categories?.length ?? 0} categories`,
    );
  }

  return { products, categories };
}
