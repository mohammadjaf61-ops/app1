/**
 * Product-related types
 */

import type { BaseEntity } from '../common';

/**
 * Category
 */
export interface Category extends BaseEntity {
  nameAr: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

/**
 * Category tree node (with children)
 */
export interface CategoryTree extends Category {
  children: CategoryTree[];
}

/**
 * Product
 */
export interface Product extends BaseEntity {
  sku: string;
  barcode: string | null;
  nameAr: string;
  descriptionAr: string | null;
  imageUrl: string | null;
  categoryId: string;
  costPrice: number; // سعر التكلفة
  salePrice: number; // سعر البيع
  isActive: boolean;
  deletedAt: Date | null;
}

/**
 * Product with category info
 */
export interface ProductWithCategory extends Product {
  category: Category;
}

/**
 * Product list filters
 */
export interface ProductFilters {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Create product DTO
 */
export interface CreateProductDto {
  sku: string;
  barcode?: string;
  nameAr: string;
  descriptionAr?: string;
  imageUrl?: string;
  categoryId: string;
  costPrice: number;
  salePrice: number;
  isActive?: boolean;
}

/**
 * Update product DTO
 */
export interface UpdateProductDto {
  sku?: string;
  barcode?: string;
  nameAr?: string;
  descriptionAr?: string;
  imageUrl?: string;
  categoryId?: string;
  costPrice?: number;
  salePrice?: number;
  isActive?: boolean;
}

/**
 * Create category DTO
 */
export interface CreateCategoryDto {
  nameAr: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Update category DTO
 */
export interface UpdateCategoryDto {
  nameAr?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}
