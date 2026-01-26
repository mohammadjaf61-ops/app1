import * as SecureStore from 'expo-secure-store';
import { API_URL, STORAGE_KEYS } from './constants';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = API_URL;
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  setToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as any)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في الاتصال');
      }

      return data;
    } catch (error: any) {
      if (error.message === 'Network request failed') {
        throw new Error('لا يوجد اتصال بالإنترنت');
      }
      throw error;
    }
  }

  // Auth endpoints
  async requestOtp(phone: string) {
    return this.request<{ message: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, code: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: any;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/me');
  }

  // Picker orders endpoints
  async getAssignedOrders() {
    return this.request<any[]>('/orders/picker/assigned');
  }

  async getOrder(orderId: string) {
    return this.request<any>(`/orders/${orderId}`);
  }

  async startPicking(orderId: string) {
    return this.request<any>(`/orders/${orderId}/start-picking`, {
      method: 'POST',
    });
  }

  async pickItem(orderId: string, itemId: string) {
    return this.request<any>(`/orders/${orderId}/items/${itemId}/pick`, {
      method: 'POST',
    });
  }

  async markItemUnavailable(
    orderId: string,
    itemId: string,
    reason: string,
    notes?: string
  ) {
    return this.request<any>(`/orders/${orderId}/items/${itemId}/unavailable`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  async completeOrder(orderId: string) {
    return this.request<any>(`/orders/${orderId}/complete-picking`, {
      method: 'POST',
    });
  }

  // Stats for picker dashboard
  async getPickerStats() {
    return this.request<{
      todayCompleted: number;
      todayItems: number;
      avgPickTime: number;
    }>('/orders/picker/stats');
  }
}

export const apiClient = new ApiClient();
