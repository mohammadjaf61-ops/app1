import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

/**
 * POS order item - identified by SKU or barcode
 */
export class PosOrderItemDto {
  @ApiProperty({
    description: 'Product SKU or barcode',
    example: 'PRD-001',
  })
  @IsString({ message: 'pos.skuRequired' })
  @IsNotEmpty({ message: 'pos.skuRequired' })
  sku: string;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
    default: 1,
  })
  @IsInt({ message: 'pos.quantityMustBeInteger' })
  @Min(1, { message: 'pos.quantityMinimum' })
  quantity: number;
}

/**
 * Create POS order request
 */
export class CreatePosOrderDto {
  @ApiProperty({
    description: 'Order items with SKU and quantity',
    type: [PosOrderItemDto],
  })
  @IsArray({ message: 'pos.itemsRequired' })
  @ArrayMinSize(1, { message: 'pos.itemsRequired' })
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Customer name (optional for walk-in)',
    example: 'أحمد',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Customer phone (optional)',
    example: '07701234567',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Order notes',
    example: 'Cash payment',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * POS order response
 */
export class PosOrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order number (receipt number)' })
  orderNumber: string;

  @ApiProperty({ description: 'Order items' })
  items: PosOrderItemResponseDto[];

  @ApiProperty({ description: 'Subtotal in IQD' })
  subtotalIqd: number;

  @ApiProperty({ description: 'Total in IQD' })
  totalIqd: number;

  @ApiProperty({ description: 'Payment status' })
  paymentStatus: string;

  @ApiProperty({ description: 'Order status' })
  orderStatus: string;

  @ApiProperty({ description: 'Cashier ID' })
  cashierId: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}

/**
 * POS order item response
 */
export class PosOrderItemResponseDto {
  @ApiProperty({ description: 'Product SKU' })
  sku: string;

  @ApiProperty({ description: 'Product name' })
  nameAr: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Unit price in IQD' })
  unitPriceIqd: number;

  @ApiProperty({ description: 'Line total in IQD' })
  totalIqd: number;
}

/**
 * Product lookup response (for barcode scan)
 */
export class ProductLookupResponseDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product SKU' })
  sku: string;

  @ApiProperty({ description: 'Product name in Arabic' })
  nameAr: string;

  @ApiProperty({ description: 'Sale price in IQD' })
  salePriceIqd: number;

  @ApiProperty({ description: 'Available quantity' })
  availableQuantity: number;

  @ApiProperty({ description: 'Is product in stock' })
  inStock: boolean;
}

/**
 * POS session statistics
 */
export class PosSessionStatsDto {
  @ApiProperty({ description: 'Number of orders today' })
  ordersToday: number;

  @ApiProperty({ description: 'Total revenue today in IQD' })
  revenueToday: number;

  @ApiProperty({ description: 'Average order value in IQD' })
  averageOrderValue: number;

  @ApiProperty({ description: 'Items sold today' })
  itemsSoldToday: number;
}
