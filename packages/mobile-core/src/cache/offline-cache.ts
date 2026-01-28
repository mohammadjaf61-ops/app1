/**
 * Offline Cache Service for API Responses
 *
 * Provides simple read-through caching for API responses.
 * Uses AsyncStorage for persistence with configurable TTL.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@hypermarket/cache/';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  /** Time-to-live in milliseconds. Default: 24 hours */
  ttl?: number;
}

/**
 * Get cached data for a key.
 * Returns null if not found or expired.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const raw = await AsyncStorage.getItem(cacheKey);

    if (!raw) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(raw);
    const now = Date.now();

    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      // Expired - remove and return null
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Store data in cache.
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  options: CacheOptions = {},
): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl ?? DEFAULT_TTL_MS,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    // Silently fail - cache is optional
    if (__DEV__) {
      console.warn('Cache write failed:', error);
    }
  }
}

/**
 * Remove cached data for a key.
 */
export async function removeCachedData(key: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.removeItem(cacheKey);
  } catch {
    // Silently fail
  }
}

/**
 * Clear all cached data.
 */
export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Get cache statistics.
 */
export async function getCacheStats(): Promise<{
  count: number;
  keys: string[];
}> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));

    return {
      count: cacheKeys.length,
      keys: cacheKeys.map((k) => k.replace(CACHE_PREFIX, '')),
    };
  } catch {
    return { count: 0, keys: [] };
  }
}

/**
 * Generate cache key from endpoint and params.
 */
export function createCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${JSON.stringify(params[k])}`)
    .join('&');

  return `${endpoint}?${sortedParams}`;
}

// Pre-defined TTLs for common use cases
export const CACHE_TTL = {
  /** 5 minutes - for frequently changing data */
  SHORT: 5 * 60 * 1000,
  /** 1 hour - for moderately stable data */
  MEDIUM: 60 * 60 * 1000,
  /** 24 hours - for stable data like categories */
  LONG: 24 * 60 * 60 * 1000,
  /** 7 days - for rarely changing data */
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;
