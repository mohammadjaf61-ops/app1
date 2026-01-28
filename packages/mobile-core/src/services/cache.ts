/**
 * Simple Cache Service
 *
 * Provides offline caching for API responses using AsyncStorage.
 * Supports TTL-based expiration for cached data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@cache:';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  /** Time to live in milliseconds (default: 24 hours) */
  ttl?: number;
}

class CacheService {
  /**
   * Store data in cache
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? DEFAULT_TTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      console.error('[CacheService] Failed to set cache:', key, error);
    }
  }

  /**
   * Retrieve data from cache
   * Returns null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(raw);

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        // Clean up expired entry
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('[CacheService] Failed to get cache:', key, error);
      return null;
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Remove a cache entry
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.error('[CacheService] Failed to remove cache:', key, error);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('[CacheService] Failed to clear cache:', error);
    }
  }

  /**
   * Get cache entry with metadata
   */
  async getWithMeta<T>(key: string): Promise<{ data: T; age: number; isStale: boolean } | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = Date.now() - entry.timestamp;
      const isStale = age > entry.ttl;

      return {
        data: entry.data,
        age,
        isStale,
      };
    } catch (error) {
      console.error('[CacheService] Failed to get cache with meta:', key, error);
      return null;
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache key generators for common entities
export const CacheKeys = {
  categories: () => 'categories',
  products: (params?: Record<string, unknown>) =>
    params ? `products:${JSON.stringify(params)}` : 'products:all',
  product: (id: string) => `product:${id}`,
  homeOffers: () => 'home:offers',
  homeRecommended: () => 'home:recommended',
};
