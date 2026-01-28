/**
 * Common types and interfaces used across the hypermarket platform
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  meta?: PaginationMeta;
}

/**
 * API Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  /** Additional error details (e.g., insufficient stock items) */
  details?: unknown;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortDirection?: SortDirection;
}

/**
 * Timestamp fields
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base entity with common fields
 */
export interface BaseEntity extends Timestamps {
  id: string;
}

/**
 * System setting (key-value store)
 */
export interface Setting {
  key: string;
  value: string;
  updatedAt: Date;
}

/**
 * Common setting keys
 */
export enum SettingKey {
  DELIVERY_FEE_IQD = 'delivery_fee_iqd',
  MIN_ORDER_AMOUNT_IQD = 'min_order_amount_iqd',
  STORE_NAME_AR = 'store_name_ar',
  STORE_PHONE = 'store_phone',
  STORE_ADDRESS_AR = 'store_address_ar',
  STORE_OPEN_TIME = 'store_open_time',
  STORE_CLOSE_TIME = 'store_close_time',
}

/**
 * Environment type
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Money amount with currency
 */
export interface MoneyAmount {
  amount: number;
  currency: 'IQD';
}
