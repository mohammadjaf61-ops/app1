/**
 * Product-related types
 */

import type {
  BaseEntity,
  SoftDelete,
  LocalizedContent,
  StoreLocation,
  MoneyAmount,
} from '../common';

/**
 * Product status
 */
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

/**
 * Category
 */
export interface Category extends BaseEntity, SoftDelete {
  name: LocalizedContent;
  slug: string;
  description?: LocalizedContent;
  imageUrl?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Category tree node
 */
export interface CategoryTree extends Category {
  children: CategoryTree[];
}

/**
 * Product
 */
export interface Product extends BaseEntity, SoftDelete {
  sku: string;
  barcode?: string;
  name: LocalizedContent;
  description?: LocalizedContent;
  categoryId: string;
  price: MoneyAmount;
  compareAtPrice?: MoneyAmount;
  images: ProductImage[];
  status: ProductStatus;
  stockQuantity: number;
  lowStockThreshold: number;
  location: StoreLocation;
  weight?: number; // in grams
  unit: ProductUnit;
  unitValue: number; // e.g., 500 for 500g
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
}

/**
 * Product image
 */
export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
  isPrimary: boolean;
}

/**
 * Product unit types
 */
export enum ProductUnit {
  PIECE = 'PIECE', // قطعة
  KG = 'KG', // كيلوغرام
  GRAM = 'GRAM', // غرام
  LITER = 'LITER', // لتر
  ML = 'ML', // مليلتر
  PACK = 'PACK', // عبوة
  BOX = 'BOX', // صندوق
  DOZEN = 'DOZEN', // درزن
}

/**
 * Product list filters
 */
export interface ProductFilters {
  categoryId?: string;
  status?: ProductStatus;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

/**
 * Product creation DTO
 */
export interface CreateProductDto {
  sku: string;
  barcode?: string;
  name: LocalizedContent;
  description?: LocalizedContent;
  categoryId: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  location: StoreLocation;
  weight?: number;
  unit: ProductUnit;
  unitValue: number;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

/**
 * Stock update DTO
 */
export interface StockUpdateDto {
  productId: string;
  quantity: number;
  reason: StockUpdateReason;
  notes?: string;
}

/**
 * Stock update reasons
 */
export enum StockUpdateReason {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE',
  EXPIRED = 'EXPIRED',
}
