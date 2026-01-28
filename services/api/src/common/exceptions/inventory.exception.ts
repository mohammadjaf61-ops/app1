import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Inventory error codes matching shared-types InventoryErrorCode
 */
export const InventoryErrorCode = {
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PRICE_CHANGED: 'PRICE_CHANGED',
  PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
  RESERVATION_EXPIRED: 'RESERVATION_EXPIRED',
} as const;

export type InventoryErrorCodeType = (typeof InventoryErrorCode)[keyof typeof InventoryErrorCode];

/**
 * Item with insufficient stock
 */
export interface InsufficientStockItem {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
}

/**
 * Item with changed price
 */
export interface PriceChangedItem {
  productId: string;
  productName: string;
  expectedPrice: number;
  currentPrice: number;
}

/**
 * Exception for insufficient stock
 */
export class InsufficientStockException extends HttpException {
  constructor(items: InsufficientStockItem[]) {
    const productNames = items.map((i) => i.productName).join('، ');
    super(
      {
        message: `الكمية المطلوبة غير متوفرة للمنتجات: ${productNames}`,
        errorCode: InventoryErrorCode.INSUFFICIENT_STOCK,
        details: { items },
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Exception for price changes
 */
export class PriceChangedException extends HttpException {
  constructor(items: PriceChangedItem[]) {
    const productNames = items.map((i) => i.productName).join('، ');
    super(
      {
        message: `تغيرت أسعار المنتجات التالية: ${productNames}`,
        errorCode: InventoryErrorCode.PRICE_CHANGED,
        details: { items },
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Exception for unavailable product
 */
export class ProductUnavailableException extends HttpException {
  constructor(productIds: string[]) {
    super(
      {
        message: 'بعض المنتجات غير متوفرة حالياً',
        errorCode: InventoryErrorCode.PRODUCT_UNAVAILABLE,
        details: { productIds },
      },
      HttpStatus.CONFLICT,
    );
  }
}
