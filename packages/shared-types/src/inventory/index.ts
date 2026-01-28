/**
 * Inventory-related types
 */

import type { BaseEntity } from '../common';
import type { Product } from '../product';

/**
 * Inventory reservation status
 */
export enum ReservationStatus {
  HELD = 'HELD', // محجوز - ينتظر التأكيد
  COMMITTED = 'COMMITTED', // مؤكد - تم خصم المخزون
  RELEASED = 'RELEASED', // محرر - أعيد للمخزون
}

/**
 * Inventory error codes for API responses
 */
export enum InventoryErrorCode {
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK', // نفاد المخزون
  PRICE_CHANGED = 'PRICE_CHANGED', // تغير السعر
  PRODUCT_UNAVAILABLE = 'PRODUCT_UNAVAILABLE', // المنتج غير متوفر
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED', // انتهت صلاحية الحجز
}

/**
 * Inventory reservation
 */
export interface InventoryReservation {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Insufficient stock error detail
 */
export interface InsufficientStockItem {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
}

/**
 * Price changed error detail
 */
export interface PriceChangedItem {
  productId: string;
  productName: string;
  expectedPrice: number;
  currentPrice: number;
}

/**
 * Inventory validation error response
 */
export interface InventoryValidationError {
  errorCode: InventoryErrorCode;
  message: string;
  items?: InsufficientStockItem[] | PriceChangedItem[];
}

/**
 * Inventory location - physical storage in store
 * Format: Aisle → Shelf → Bin (e.g., A-1-A)
 */
export interface InventoryLocation extends Omit<BaseEntity, 'updatedAt'> {
  aisle: string;
  shelf: string;
  bin: string | null;
}

/**
 * Inventory item - links product to location with quantity
 */
export interface InventoryItem {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  expiryDate: Date | null;
  updatedAt: Date;
}

/**
 * Inventory item with relations
 */
export interface InventoryItemWithDetails extends InventoryItem {
  product: Product;
  location: InventoryLocation;
}

/**
 * Location creation DTO
 */
export interface CreateLocationDto {
  aisle: string;
  shelf: string;
  bin?: string;
}

/**
 * Inventory update DTO
 */
export interface UpdateInventoryDto {
  productId: string;
  locationId: string;
  quantity: number;
  expiryDate?: Date;
}

/**
 * Inventory adjustment DTO
 */
export interface AdjustInventoryDto {
  productId: string;
  locationId: string;
  quantityChange: number; // Positive for add, negative for remove
  reason: string;
}

/**
 * Inventory query filters
 */
export interface InventoryFilters {
  productId?: string;
  locationId?: string;
  lowStock?: boolean;
  expiringSoon?: boolean; // Items expiring within 7 days
}

/**
 * Stock level summary for a product
 */
export interface ProductStockSummary {
  productId: string;
  totalQuantity: number;
  locationCount: number;
  locations: {
    location: InventoryLocation;
    quantity: number;
    expiryDate: Date | null;
  }[];
}
