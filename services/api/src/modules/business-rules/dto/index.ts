import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsUUID, IsNotEmpty, Min } from 'class-validator';

/**
 * Request DTO for order validation
 */
export class ValidateOrderDto {
  @ApiProperty({
    description: 'Order subtotal in IQD (before delivery fee)',
    example: 25000,
  })
  @IsNumber()
  @Min(0)
  subtotalIqd: number;

  @ApiProperty({
    description: 'Delivery zone ID',
    example: 'zone-uuid-here',
  })
  @IsUUID('4')
  @IsNotEmpty()
  deliveryZoneId: string;
}

/**
 * Delivery zone response
 */
export class DeliveryZoneResponseDto {
  @ApiProperty({ example: 'zone-uuid' })
  id: string;

  @ApiProperty({ example: 'الكرادة' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Karrada' })
  nameEn?: string;

  @ApiProperty({ example: 5000 })
  feeIqd: number;

  @ApiProperty({ example: 15000 })
  minOrderIqd: number;

  @ApiPropertyOptional({ example: 45 })
  estimatedMinutes?: number;

  @ApiProperty({ example: true })
  isActive: boolean;
}

/**
 * Store hours response
 */
export class StoreHoursResponseDto {
  @ApiProperty({ example: 'SUNDAY' })
  dayOfWeek: string;

  @ApiProperty({ example: '08:00' })
  openAt: string;

  @ApiProperty({ example: '22:00' })
  closeAt: string;

  @ApiProperty({ example: false })
  isClosed: boolean;

  @ApiProperty({ example: 60 })
  orderCutoffMinutes: number;
}

/**
 * Store availability response
 */
export class StoreAvailabilityResponseDto {
  @ApiProperty({ example: true })
  isOpen: boolean;

  @ApiProperty({ example: true })
  canPlaceOrder: boolean;

  @ApiPropertyOptional({ example: 'businessRules.storeClosed' })
  errorCode?: string;

  @ApiPropertyOptional({ example: '14:30' })
  currentTime?: string;

  @ApiPropertyOptional({ example: '08:00' })
  openAt?: string;

  @ApiPropertyOptional({ example: '22:00' })
  closeAt?: string;

  @ApiPropertyOptional({ example: '21:00' })
  orderCutoffTime?: string;

  @ApiPropertyOptional({ example: 'MONDAY' })
  nextOpenDay?: string;

  @ApiPropertyOptional({ example: '08:00' })
  nextOpenTime?: string;
}

/**
 * Order validation response
 */
export class OrderValidationResponseDto {
  @ApiProperty({ example: true })
  canProceed: boolean;

  @ApiProperty({ example: [], type: [String] })
  errors: string[];

  @ApiProperty({ type: StoreAvailabilityResponseDto })
  storeAvailability: StoreAvailabilityResponseDto;

  @ApiPropertyOptional()
  pricingValidation?: {
    isValid: boolean;
    errorCode?: string;
    minimumOrderIqd?: number;
    currentTotalIqd?: number;
    deliveryFeeIqd?: number;
    zoneName?: string;
  };

  @ApiPropertyOptional({ example: 5000 })
  deliveryFeeIqd?: number;

  @ApiPropertyOptional({ example: 30000 })
  totalAmountIqd?: number;
}
