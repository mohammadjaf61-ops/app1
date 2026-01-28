import { ApiErrorResponseSchema } from '@hypermarket/contracts';
import * as SecureStore from 'expo-secure-store';
import type { ZodType, ZodError } from 'zod';

export interface ApiError {
  statusCode: number;
  message: string;
  errorCode?: string;
  validationErrors?: Record<string, string[]>;
}

export class ApiException extends Error implements ApiError {
  statusCode: number;
  errorCode?: string;
  validationErrors?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.statusCode = error.statusCode;
    this.errorCode = error.errorCode;
    this.validationErrors = error.validationErrors;
  }

  /**
   * Check if this is a validation error from Zod
   */
  isValidationError(): boolean {
    return this.errorCode === 'VALIDATION_ERROR';
  }

  /**
   * Check if this is a network error
   */
  isNetworkError(): boolean {
    return this.errorCode === 'NETWORK_ERROR';
  }
}

/**
 * Create ApiException from Zod validation error
 */
function createValidationException(error: ZodError): ApiException {
  const validationErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!validationErrors[path]) {
      validationErrors[path] = [];
    }
    validationErrors[path].push(issue.message);
  }

  return new ApiException({
    statusCode: 422,
    message: 'خطأ في التحقق من البيانات',
    errorCode: 'VALIDATION_ERROR',
    validationErrors,
  });
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

  /**
   * Make a typed request with Zod schema validation
   */
  protected async requestWithSchema<T>(
    endpoint: string,
    schema: ZodType<T>,
    options: RequestInit = {},
  ): Promise<T> {
    const data = await this.request<unknown>(endpoint, options);

    const result = schema.safeParse(data);
    if (!result.success) {
      console.error('Response validation failed:', result.error.issues);
      throw createValidationException(result.error);
    }

    return result.data;
  }

  /**
   * Make a raw request without schema validation (legacy support)
   */
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
        // Try to parse as standard API error
        const errorResult = ApiErrorResponseSchema.safeParse(data);
        if (errorResult.success) {
          throw new ApiException({
            statusCode: errorResult.data.statusCode,
            message: errorResult.data.message,
            errorCode: errorResult.data.errorCode,
          });
        }

        // Fallback to generic error
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

  // ============================================
  // Typed methods with schema validation
  // ============================================

  /**
   * GET request with response schema validation
   */
  getTyped<T>(endpoint: string, schema: ZodType<T>): Promise<T> {
    return this.requestWithSchema(endpoint, schema, { method: 'GET' });
  }

  /**
   * POST request with response schema validation
   */
  postTyped<T>(endpoint: string, schema: ZodType<T>, data?: unknown): Promise<T> {
    return this.requestWithSchema(endpoint, schema, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request with response schema validation
   */
  putTyped<T>(endpoint: string, schema: ZodType<T>, data?: unknown): Promise<T> {
    return this.requestWithSchema(endpoint, schema, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request with response schema validation
   */
  patchTyped<T>(endpoint: string, schema: ZodType<T>, data?: unknown): Promise<T> {
    return this.requestWithSchema(endpoint, schema, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // ============================================
  // Legacy untyped methods (for backward compatibility)
  // ============================================

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
