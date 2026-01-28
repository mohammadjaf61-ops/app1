const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface PosOrderItem {
  sku: string;
  quantity: number;
}

interface CreatePosOrderRequest {
  items: PosOrderItem[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

interface ProductLookup {
  id: string;
  sku: string;
  nameAr: string;
  salePriceIqd: number;
  availableQuantity: number;
  inStock: boolean;
}

interface PosOrderResponse {
  id: string;
  orderNumber: string;
  items: Array<{
    sku: string;
    nameAr: string;
    quantity: number;
    unitPriceIqd: number;
    totalIqd: number;
  }>;
  subtotalIqd: number;
  totalIqd: number;
  paymentStatus: string;
  orderStatus: string;
  cashierId: string;
  createdAt: string;
}

interface SessionStats {
  ordersToday: number;
  revenueToday: number;
  averageOrderValue: number;
  itemsSoldToday: number;
}

class PosApi {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('pos_token', token);
      } else {
        localStorage.removeItem('pos_token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) {
      return this.token;
    }
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('pos_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async lookupProduct(sku: string): Promise<ProductLookup> {
    return this.request<ProductLookup>(`/pos/products/lookup/${encodeURIComponent(sku)}`);
  }

  async createOrder(data: CreatePosOrderRequest): Promise<PosOrderResponse> {
    return this.request<PosOrderResponse>('/pos/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrder(orderNumber: string): Promise<PosOrderResponse> {
    return this.request<PosOrderResponse>(`/pos/orders/${encodeURIComponent(orderNumber)}`);
  }

  async getSessionStats(): Promise<SessionStats> {
    return this.request<SessionStats>('/pos/stats');
  }

  async getRecentOrders(limit = 10): Promise<Array<{
    id: string;
    orderNumber: string;
    totalIqd: number;
    status: string;
    itemCount: number;
    createdAt: string;
  }>> {
    return this.request(`/pos/orders?limit=${limit}`);
  }

  async login(phone: string, password: string): Promise<{ token: string; user: { id: string; fullName: string; role: string } }> {
    const response = await this.request<{ accessToken: string; user: { id: string; fullName: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    this.setToken(response.accessToken);
    return { token: response.accessToken, user: response.user };
  }
}

export const posApi = new PosApi();
export type { ProductLookup, PosOrderResponse, CreatePosOrderRequest, SessionStats };
