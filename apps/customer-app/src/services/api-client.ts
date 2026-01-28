import * as SecureStore from 'expo-secure-store';

import {
  getCachedData,
  setCachedData,
  createCacheKey,
  networkService,
  apiLogger,
  CACHE_TTL,
} from '@hypermarket/mobile-core';

import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants';

interface ApiError {
  statusCode: number;
  message: string;
  errorCode: string;
}

/** Endpoints that should be cached for offline access */
const CACHEABLE_ENDPOINTS = ['/catalog/categories', '/catalog/products'];

/** Check if an endpoint should be cached */
function isCacheable(endpoint: string): boolean {
  return CACHEABLE_ENDPOINTS.some((pattern) => endpoint.startsWith(pattern));
}

/** Get TTL for an endpoint */
function getCacheTTL(endpoint: string): number {
  if (endpoint.startsWith('/catalog/categories')) {
    return CACHE_TTL.LONG; // 24 hours for categories
  }
  if (endpoint.startsWith('/catalog/products')) {
    return CACHE_TTL.MEDIUM; // 1 hour for products
  }
  return CACHE_TTL.SHORT; // 5 minutes default
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async setToken(token: string | null): Promise<void> {
    this.token = token;
    if (token) {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    }
  }

  async getToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    try {
      this.token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      this.token = null;
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        statusCode: response.status,
        message: 'حدث خطأ غير متوقع',
        errorCode: 'UNKNOWN_ERROR',
      }));
      throw error;
    }

    return response.json();
  }

  /**
   * GET request with offline cache support.
   * - If online: fetches from API and caches result
   * - If offline: returns cached data if available
   */
  async get<T>(endpoint: string): Promise<T> {
    const cacheKey = createCacheKey(endpoint);
    const isOnline = networkService.isOnline();

    // If offline, try to get from cache first
    if (!isOnline) {
      if (isCacheable(endpoint)) {
        const cached = await getCachedData<T>(cacheKey);
        if (cached) {
          apiLogger.info('Serving from offline cache', {
            metadata: { endpoint, cacheKey },
          });
          return cached;
        }
      }

      // No cache available - throw network error
      const error: ApiError = {
        statusCode: 0,
        message: 'لا يوجد اتصال بالإنترنت',
        errorCode: 'NETWORK_OFFLINE',
      };
      throw error;
    }

    // Online - fetch from API
    try {
      const data = await this.request<T>(endpoint, { method: 'GET' });

      // Cache the response for offline use
      if (isCacheable(endpoint)) {
        await setCachedData(cacheKey, data, { ttl: getCacheTTL(endpoint) });
        apiLogger.debug('Cached API response', {
          metadata: { endpoint, cacheKey },
        });
      }

      return data;
    } catch (error) {
      // On network error, try cache as fallback
      if (this.isNetworkError(error) && isCacheable(endpoint)) {
        const cached = await getCachedData<T>(cacheKey);
        if (cached) {
          apiLogger.warn('Network error, serving from cache', {
            metadata: { endpoint },
          });
          return cached;
        }
      }
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    this.ensureOnline();
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    this.ensureOnline();
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    this.ensureOnline();
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    this.ensureOnline();
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /** Ensure we're online before making mutating requests */
  private ensureOnline(): void {
    if (!networkService.isOnline()) {
      const error: ApiError = {
        statusCode: 0,
        message: 'هذه العملية تتطلب اتصالاً بالإنترنت',
        errorCode: 'NETWORK_OFFLINE',
      };
      throw error;
    }
  }

  /** Check if an error is a network error */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes('Network')) {
      return true;
    }
    if (typeof error === 'object' && error !== null) {
      const e = error as { errorCode?: string };
      return e.errorCode === 'NETWORK_OFFLINE';
    }
    return false;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiError };
