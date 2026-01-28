/**
 * Cache key prefixes and TTL configuration
 * All cache keys follow the pattern: {prefix}:{version}
 */

// Key prefixes - versioned to allow cache invalidation on schema changes
export const CACHE_KEYS = {
  // Products
  PRODUCTS_LIST: 'products:list:v1',
  PRODUCT_BY_ID: 'product:id:v1',
  PRODUCT_BY_SKU: 'product:sku:v1',

  // Categories
  CATEGORIES_LIST: 'categories:list:v1',
  CATEGORIES_TREE: 'categories:tree:v1',
  CATEGORY_BY_ID: 'category:id:v1',
  CATEGORY_BY_SLUG: 'category:slug:v1',

  // Catalog (unified)
  CATALOG_PRODUCTS: 'catalog:products:v1',
  CATALOG_CATEGORIES: 'catalog:categories:v1',
  CATALOG_CATEGORY_TREE: 'catalog:category-tree:v1',

  // Admin dashboard
  ADMIN_KPIS: 'admin:kpis:v1',

  // Settings
  SETTINGS: 'settings:v1',
} as const;

// TTL in seconds
export const CACHE_TTL = {
  // Products: 10 minutes - moderate change frequency
  PRODUCTS_LIST: 600,
  PRODUCT_DETAIL: 600,

  // Categories: 15 minutes - lower change frequency
  CATEGORIES_LIST: 900,
  CATEGORIES_TREE: 900,
  CATEGORY_DETAIL: 900,

  // Admin dashboard: 60 seconds - near real-time KPIs
  ADMIN_KPIS: 60,
} as const;

// Helper to create cache key with parameters
export function createCacheKey(prefix: string, ...params: (string | number)[]): string {
  if (params.length === 0) {
    return prefix;
  }
  return `${prefix}:${params.join(':')}`;
}
