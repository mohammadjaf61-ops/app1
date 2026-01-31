// API base URL - set EXPO_PUBLIC_API_URL in .env for production
// Expo's babel transform handles EXPO_PUBLIC_* at build time
declare const process: { env: { EXPO_PUBLIC_API_URL?: string } };
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  CART: 'cart_data',
} as const;

export const QUERY_KEYS = {
  categories: ['categories'],
  products: (filters?: Record<string, unknown>) => ['products', filters],
  product: (id: string) => ['products', id],
  orders: ['orders'],
  order: (id: string) => ['orders', id],
} as const;

// Default delivery fee in IQD - can be overridden via EXPO_PUBLIC_DELIVERY_FEE
// In production, this should be fetched from the API/settings service
export const DELIVERY_FEE = 5000;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  PICKING: 'قيد التجهيز',
  READY: 'جاهز للتوصيل',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
};
