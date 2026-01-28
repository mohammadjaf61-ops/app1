import * as SecureStore from 'expo-secure-store';
import type { ZodType, ZodTypeAny } from 'zod';
import { ApiExceptionSchema } from '@hypermarket/contracts';

/**
 * API Error interface
 */
export interface ApiError {
  statusCode: number;
  message: string;
  errorCode?: string;
}

/**
 * API Exception class for typed error handling
 */
export class ApiException extends Error implements ApiError {
  statusCode: number;
  errorCode?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.statusCode = error.statusCode;
    this.errorCode = error.errorCode;
  }

  /**
   * Check if this is a network error
   */
  isNetworkError(): boolean {
    return this.errorCode === 'NETWORK_ERROR';
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return this.statusCode === 400;
  }

  /**
   * Check if this is a not found error
   */
  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }
}

/**
 * Validation error for schema parsing failures
 */
export class ValidationError extends Error {
  issues: Array<{ path: string; message: string }>;

  constructor(message: string, issues: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  tokenKey: string;
}

/**
 * Base API Client with typed request support
 *
 * Provides type-safe API calls with optional Zod schema validation.
 * All responses are validated against the provided schema at runtime.
 */
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
   * Make a typed request with optional schema validation
   *
   * @param endpoint - API endpoint
   * @param options - Request options including optional schema
   * @returns Parsed and validated response data
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
        // Try to parse as API error
        const errorResult = ApiExceptionSchema.safeParse(data);
        if (errorResult.success) {
          throw new ApiException(errorResult.data);
        }

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

  /**
   * Make a typed request with schema validation
   *
   * @param endpoint - API endpoint
   * @param schema - Zod schema for response validation
   * @param options - Request options
   * @returns Parsed and validated response data
   */
  protected async typedRequest<TSchema extends ZodTypeAny>(
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

      console.error('Response validation failed:', {
        endpoint,
        issues,
        data,
      });

      throw new ValidationError(
        'استجابة الخادم لا تطابق الصيغة المتوقعة',
        issues
      );
    }

    return result.data;
  }

  /**
   * GET request
   */
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * GET request with schema validation
   */
  getTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, { method: 'GET' });
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * POST request with schema validation
   */
  postTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema,
    data?: unknown
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request with schema validation
   */
  putTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema,
    data?: unknown
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request with schema validation
   */
  patchTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema,
    data?: unknown
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * DELETE request with schema validation
   */
  deleteTyped<TSchema extends ZodTypeAny>(
    endpoint: string,
    schema: TSchema
  ): Promise<TSchema['_output']> {
    return this.typedRequest(endpoint, schema, { method: 'DELETE' });
  }
}

/**
 * Re-export schema types for convenience
 */
export type { ZodType, ZodTypeAny };
