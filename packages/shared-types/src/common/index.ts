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
 * Iraqi Dinar currency formatting
 * Currency code: IQD
 * No decimal places (IQD uses whole numbers)
 */
export interface MoneyAmount {
  amount: number;
  currency: 'IQD';
}

/**
 * Timestamp fields for audit
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft delete field
 */
export interface SoftDelete {
  deletedAt: Date | null;
}

/**
 * Base entity with common fields
 */
export interface BaseEntity extends Timestamps {
  id: string;
}

/**
 * Arabic localized content
 */
export interface LocalizedContent {
  ar: string;
  en?: string;
}

/**
 * Product location in store
 * Used for picker navigation
 */
export interface StoreLocation {
  aisle: string;
  shelf: string;
  bin?: string;
}

/**
 * Text-based delivery address (no maps)
 * Iraq market specific
 */
export interface DeliveryAddress {
  governorate: string; // المحافظة
  district: string; // المنطقة
  neighborhood: string; // الحي
  street: string; // الشارع
  building?: string; // البناية
  floor?: string; // الطابق
  apartment?: string; // الشقة
  landmark?: string; // علامة مميزة
  notes?: string; // ملاحظات إضافية
  phoneNumber: string;
}

/**
 * Environment type
 */
export type Environment = 'development' | 'staging' | 'production';
