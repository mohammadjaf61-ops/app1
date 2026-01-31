export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  CART: 'cart_data',
  RECENT_SEARCHES: 'recent_searches',
  SELECTED_ADDRESS: 'selected_address',
} as const;

export const QUERY_KEYS = {
  // Catalog
  categories: ['categories'],
  category: (id: string) => ['categories', id],
  products: (filters?: Record<string, unknown>) => ['products', filters],
  product: (id: string) => ['products', id],
  searchProducts: (query: string) => ['products', 'search', query],

  // Orders
  orders: ['orders'],
  order: (id: string) => ['orders', id],

  // User
  profile: ['profile'],
  addresses: ['addresses'],

  // Home
  homeOffers: ['home', 'offers'],
  homeRecommended: ['home', 'recommended'],
} as const;

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PICKING: 'PICKING',
  READY: 'READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const DELIVERY_FEE = 5000; // IQD - Default delivery fee
