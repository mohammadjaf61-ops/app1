import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'driver_access_token',
  REFRESH_TOKEN: 'driver_refresh_token',
  USER: 'driver_user',
} as const;

export const DELIVERY_STATUS = {
  READY: 'READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
} as const;

export const DRIVER_ORDER_STATUSES = ['READY', 'OUT_FOR_DELIVERY'] as const;

export const FAILED_DELIVERY_REASONS = [
  { value: 'CUSTOMER_UNAVAILABLE', label: 'العميل غير متواجد' },
  { value: 'WRONG_ADDRESS', label: 'العنوان غير صحيح' },
  { value: 'CUSTOMER_REFUSED', label: 'العميل رفض الاستلام' },
  { value: 'PAYMENT_ISSUE', label: 'مشكلة في الدفع' },
  { value: 'OTHER', label: 'سبب آخر' },
] as const;

export type FailedDeliveryReason = typeof FAILED_DELIVERY_REASONS[number]['value'];

// Demo delivery address
export const DEMO_DELIVERY_ADDRESS = 'مجمع الأميرات السكني – بلوك 25';
