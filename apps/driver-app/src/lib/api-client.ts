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

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryAddressText: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
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

  // Driver delivery endpoints
  async getAssignedDeliveries() {
    return this.request<DeliveryOrder[]>('/orders/driver/assigned');
  }

  async getDelivery(orderId: string) {
    return this.request<DeliveryOrder>(`/orders/${orderId}`);
  }

  async confirmPickup(orderId: string) {
    return this.request<DeliveryOrder>(`/orders/${orderId}/pickup`, {
      method: 'POST',
    });
  }

  async startDelivery(orderId: string) {
    return this.request<DeliveryOrder>(`/orders/${orderId}/start-delivery`, {
      method: 'POST',
    });
  }

  async completeDelivery(orderId: string, notes?: string) {
    return this.request<DeliveryOrder>(`/orders/${orderId}/complete-delivery`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async failDelivery(orderId: string, reason: string, notes?: string) {
    return this.request<DeliveryOrder>(`/orders/${orderId}/fail-delivery`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  // Stats for driver dashboard
  async getDriverStats() {
    return this.request<{
      todayDelivered: number;
      todayFailed: number;
      totalEarnings: number;
    }>('/orders/driver/stats');
  }
}

export const apiClient = new ApiClient();
