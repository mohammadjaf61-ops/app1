import type { ZodTypeAny } from 'zod';
import { ApiExceptionSchema } from '@hypermarket/contracts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/**
 * API Error interface with request tracking
 */
export interface ApiError {
  statusCode: number;
  message: string;
  errorCode: string;
  requestId?: string; // For debugging and support
}

/**
 * Validation error for schema parsing failures
 */
export class ValidationError extends Error {
  issues: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    issues: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/**
 * API Client with typed request support
 *
 * Provides type-safe API calls with optional Zod schema validation.
 */
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
      }
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (this.token) {
      return this.token;
    }
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

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
      const data = await response.json().catch(() => null);

      // Try to parse as API error
      const errorResult = ApiExceptionSchema.safeParse(data);
      if (errorResult.success) {
        throw {
          statusCode: errorResult.data.statusCode,
          message: errorResult.data.message,
          errorCode: errorResult.data.errorCode || 'UNKNOWN_ERROR',
          requestId,
        } as ApiError;
      }

      throw {
        statusCode: response.status,
        message: data?.message || 'حدث خطأ غير متوقع',
        errorCode: data?.errorCode || 'UNKNOWN_ERROR',
        requestId,
      } as ApiError;
    }

    return response.json();
  }

  /**
   * Make a typed request with schema validation
   */
  private async typedRequest<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema,
    options: RequestInit = {}
  ): Promise<TSchema['_output']> {
    const data = await this.request<unknown>(endpoint, options);

    const result = schema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      // Log validation error with requestId for debugging
      // Note: This should only appear in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('Response validation failed:', {
          endpoint,
          issues,
        });
      }

      throw new ValidationError(
        'استجابة الخادم لا تطابق الصيغة المتوقعة',
        issues
      );
    }

    return result.data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async getTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async postTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema,
    data?: unknown
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, {
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

  async putTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema,
    data?: unknown
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, {
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

  async patchTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema,
    data?: unknown
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async deleteTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
