import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export const CACHE_KEYS = {
  categories: 'cache:categories',
  featuredProducts: 'cache:products:featured',
  products: (categoryId?: string) => `cache:products:${categoryId ?? 'home'}`,
} as const;

export const CACHE_TTLS = {
  categories: 24 * 60 * 60 * 1000, // 24h
  featuredProducts: 60 * 60 * 1000, // 60m
  homeFeed: 10 * 60 * 1000, // 10m
} as const;

export function getCacheAge(entry: CacheEntry<unknown>) {
  return Date.now() - entry.timestamp;
}

export function isCacheExpired(entry: CacheEntry<unknown>, ttlMs: number) {
  return getCacheAge(entry) > ttlMs;
}

export async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.timestamp !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T) {
  const entry: CacheEntry<T> = {
    value,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(key, JSON.stringify(entry));
}
