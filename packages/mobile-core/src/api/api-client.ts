import * as SecureStore from 'expo-secure-store';

export interface ApiError {
  statusCode: number;
  message: string;
  errorCode?: string;
}

export class ApiException extends Error implements ApiError {
  statusCode: number;
  errorCode?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.statusCode = error.statusCode;
    this.errorCode = error.errorCode;
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  tokenKey: string;
}

export class BaseApiClient {
  protected baseUrl: string;
  protected tokenKey: string;
  protected accessToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.tokenKey = config.tokenKey;
    this.loadToken();
  }

  private async loadToken(): Promise<void> {
    try {
      this.accessToken = await SecureStore.getItemAsync(this.tokenKey);
    } catch (error) {
      console.error('Failed to load token:', error);
      this.accessToken = null;
    }
  }

  setToken(token: string | null): void {
    this.accessToken = token;
  }

  async saveToken(token: string | null): Promise<void> {
    this.accessToken = token;
    if (token) {
      await SecureStore.setItemAsync(this.tokenKey, token);
    } else {
      await SecureStore.deleteItemAsync(this.tokenKey);
    }
  }

  async getToken(): Promise<string | null> {
    if (this.accessToken) {
      return this.accessToken;
    }
    await this.loadToken();
    return this.accessToken;
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new ApiException({
          statusCode: response.status,
          message: data?.message || 'حدث خطأ غير متوقع',
          errorCode: data?.errorCode,
        });
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      if ((error as Error).message === 'Network request failed') {
        throw new ApiException({
          statusCode: 0,
          message: 'لا يوجد اتصال بالإنترنت',
          errorCode: 'NETWORK_ERROR',
        });
      }
      throw error;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
