/**
 * Unified API Error Codes
 *
 * Standard error codes used across the Hypermarket API.
 * Each code has a unique identifier, HTTP status, and Arabic message.
 *
 * Categories:
 * - NETWORK_*: Network/connectivity errors
 * - AUTH_*: Authentication/authorization errors
 * - VALIDATION_*: Input validation errors
 * - INVENTORY_*: Stock/inventory errors
 * - ORDER_*: Order processing errors
 * - UNEXPECTED_*: Unexpected/system errors
 */

import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Error code definition
 */
export interface ErrorCodeDefinition {
  code: string;
  httpStatus: HttpStatus;
  messageAr: string;
  messageEn: string;
}

/**
 * All API error codes
 */
export const API_ERROR_CODES = {
  // Network errors
  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    httpStatus: HttpStatus.GATEWAY_TIMEOUT,
    messageAr: 'انتهت مهلة الاتصال',
    messageEn: 'Connection timeout',
  },
  NETWORK_UNAVAILABLE: {
    code: 'NETWORK_UNAVAILABLE',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    messageAr: 'الخدمة غير متاحة حالياً',
    messageEn: 'Service unavailable',
  },

  // Authentication errors
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    httpStatus: HttpStatus.UNAUTHORIZED,
    messageAr: 'بيانات الدخول غير صحيحة',
    messageEn: 'Invalid credentials',
  },
  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_TOKEN_EXPIRED',
    httpStatus: HttpStatus.UNAUTHORIZED,
    messageAr: 'انتهت صلاحية الجلسة',
    messageEn: 'Session expired',
  },
  AUTH_TOKEN_INVALID: {
    code: 'AUTH_TOKEN_INVALID',
    httpStatus: HttpStatus.UNAUTHORIZED,
    messageAr: 'جلسة غير صالحة',
    messageEn: 'Invalid token',
  },
  AUTH_UNAUTHORIZED: {
    code: 'AUTH_UNAUTHORIZED',
    httpStatus: HttpStatus.UNAUTHORIZED,
    messageAr: 'يجب تسجيل الدخول',
    messageEn: 'Authentication required',
  },
  AUTH_FORBIDDEN: {
    code: 'AUTH_FORBIDDEN',
    httpStatus: HttpStatus.FORBIDDEN,
    messageAr: 'غير مصرح لك بهذا الإجراء',
    messageEn: 'Access denied',
  },

  // Validation errors
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    httpStatus: HttpStatus.BAD_REQUEST,
    messageAr: 'بيانات غير صالحة',
    messageEn: 'Validation failed',
  },
  VALIDATION_REQUIRED_FIELD: {
    code: 'VALIDATION_REQUIRED_FIELD',
    httpStatus: HttpStatus.BAD_REQUEST,
    messageAr: 'حقل مطلوب مفقود',
    messageEn: 'Required field missing',
  },
  VALIDATION_INVALID_FORMAT: {
    code: 'VALIDATION_INVALID_FORMAT',
    httpStatus: HttpStatus.BAD_REQUEST,
    messageAr: 'صيغة غير صحيحة',
    messageEn: 'Invalid format',
  },

  // Resource errors
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    httpStatus: HttpStatus.NOT_FOUND,
    messageAr: 'المورد غير موجود',
    messageEn: 'Resource not found',
  },
  RESOURCE_ALREADY_EXISTS: {
    code: 'RESOURCE_ALREADY_EXISTS',
    httpStatus: HttpStatus.CONFLICT,
    messageAr: 'المورد موجود مسبقاً',
    messageEn: 'Resource already exists',
  },

  // Inventory errors
  INVENTORY_OUT_OF_STOCK: {
    code: 'INVENTORY_OUT_OF_STOCK',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    messageAr: 'المنتج غير متوفر في المخزون',
    messageEn: 'Product out of stock',
  },
  INVENTORY_INSUFFICIENT: {
    code: 'INVENTORY_INSUFFICIENT',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    messageAr: 'الكمية المطلوبة غير متوفرة',
    messageEn: 'Insufficient stock',
  },

  // Order errors
  ORDER_PRICE_CHANGED: {
    code: 'ORDER_PRICE_CHANGED',
    httpStatus: HttpStatus.CONFLICT,
    messageAr: 'تغير سعر المنتج منذ إضافته للسلة',
    messageEn: 'Product price has changed',
  },
  ORDER_INVALID_STATUS: {
    code: 'ORDER_INVALID_STATUS',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    messageAr: 'لا يمكن تنفيذ هذا الإجراء على الطلب',
    messageEn: 'Invalid order status transition',
  },
  ORDER_ALREADY_CANCELLED: {
    code: 'ORDER_ALREADY_CANCELLED',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    messageAr: 'الطلب ملغى مسبقاً',
    messageEn: 'Order already cancelled',
  },
  ORDER_MINIMUM_NOT_MET: {
    code: 'ORDER_MINIMUM_NOT_MET',
    httpStatus: HttpStatus.BAD_REQUEST,
    messageAr: 'لم يتم الوصول للحد الأدنى للطلب',
    messageEn: 'Minimum order amount not met',
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    httpStatus: HttpStatus.TOO_MANY_REQUESTS,
    messageAr: 'تم تجاوز الحد المسموح من الطلبات',
    messageEn: 'Rate limit exceeded',
  },

  // Unexpected errors
  UNEXPECTED_ERROR: {
    code: 'UNEXPECTED_ERROR',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    messageAr: 'حدث خطأ غير متوقع',
    messageEn: 'Unexpected error occurred',
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    messageAr: 'خطأ في قاعدة البيانات',
    messageEn: 'Database error',
  },
} as const;

export type ErrorCode = keyof typeof API_ERROR_CODES;

/**
 * API Error Response DTO for Swagger documentation
 */
export class ApiErrorResponse {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message (Arabic)',
    example: 'بيانات غير صالحة',
  })
  message: string;

  @ApiProperty({
    description: 'Unique error code for client handling',
    example: 'VALIDATION_FAILED',
    enum: Object.keys(API_ERROR_CODES),
  })
  errorCode: string;

  @ApiProperty({
    description: 'Request correlation ID for debugging',
    example: 'abc123-def456',
    required: false,
  })
  correlationId?: string;

  @ApiProperty({
    description: 'ISO timestamp of the error',
    example: '2026-01-28T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Additional error details (validation errors, etc.)',
    required: false,
    example: { field: 'email', issue: 'Invalid format' },
  })
  details?: Record<string, unknown>;
}

/**
 * Helper to create custom HTTP exceptions with error codes
 */
import { HttpException } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(errorCode: ErrorCode, details?: Record<string, unknown>) {
    const errorDef = API_ERROR_CODES[errorCode];
    super(
      {
        statusCode: errorDef.httpStatus,
        message: errorDef.messageAr,
        errorCode: errorDef.code,
        details,
      },
      errorDef.httpStatus,
    );
  }
}
