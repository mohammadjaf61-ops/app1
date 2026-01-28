import * as SecureStore from 'expo-secure-store';

import { API_URL, STORAGE_KEYS } from './constants';

interface UserProfile {
  id: string;
  phone: string;
  fullName: string | null;
  role: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

interface PickerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    status?: string;
  }>;
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
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
    } catch (error) {
      if (error instanceof Error && error.message === 'Network request failed') {
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
    return this.request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile() {
    return this.request<UserProfile>('/auth/me');
  }

  // Picker orders endpoints
  async getAssignedOrders() {
    return this.request<PickerOrder[]>('/orders/picker/assigned');
  }

  async getOrder(orderId: string) {
    return this.request<PickerOrder>(`/orders/${orderId}`);
  }

  async startPicking(orderId: string) {
    return this.request<PickerOrder>(`/orders/${orderId}/start-picking`, {
      method: 'POST',
    });
  }

  async pickItem(orderId: string, itemId: string) {
    return this.request<PickerOrder>(`/orders/${orderId}/items/${itemId}/pick`, {
      method: 'POST',
    });
  }

  async markItemUnavailable(orderId: string, itemId: string, reason: string, notes?: string) {
    return this.request<PickerOrder>(`/orders/${orderId}/items/${itemId}/unavailable`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  async completeOrder(orderId: string) {
    return this.request<PickerOrder>(`/orders/${orderId}/complete-picking`, {
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
