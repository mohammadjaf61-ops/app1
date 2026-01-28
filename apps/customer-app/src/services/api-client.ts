import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants';

interface ApiError {
  statusCode: number;
  message: string;
  errorCode: string;
  requestId?: string; // For debugging and support
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

    // Extract requestId from response headers for debugging
    const requestId =
      response.headers.get('x-request-id') ||
      response.headers.get('x-correlation-id') ||
      undefined;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        statusCode: errorData.statusCode || response.status,
        message: errorData.message || 'حدث خطأ غير متوقع',
        errorCode: errorData.errorCode || 'UNKNOWN_ERROR',
        requestId,
      };
      throw error;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiError };
