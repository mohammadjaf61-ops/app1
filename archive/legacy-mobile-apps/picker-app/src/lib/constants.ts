import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'picker_access_token',
  REFRESH_TOKEN: 'picker_refresh_token',
  USER: 'picker_user',
} as const;

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PICKING: 'PICKING',
  READY: 'READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const PICKER_ORDER_STATUSES = ['PENDING', 'PICKING'] as const;

export const UNAVAILABLE_REASONS = [
  { value: 'OUT_OF_STOCK', label: 'نفذ من المخزون' },
  { value: 'DAMAGED', label: 'تالف' },
  { value: 'NOT_FOUND', label: 'غير موجود' },
  { value: 'EXPIRED', label: 'منتهي الصلاحية' },
] as const;

export type UnavailableReason = (typeof UNAVAILABLE_REASONS)[number]['value'];
