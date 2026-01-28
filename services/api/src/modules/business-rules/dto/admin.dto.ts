import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Matches,
} from 'class-validator';

/**
 * Days of week enum
 */
export enum DayOfWeekEnum {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

// ==================== DELIVERY ZONES ====================

export class CreateDeliveryZoneDto {
  @ApiProperty({
    description: 'Zone name in Arabic',
    example: 'الكرادة',
  })
  @IsString()
  @IsNotEmpty({ message: 'validation.required' })
  nameAr: string;

  @ApiPropertyOptional({
    description: 'Zone name in English',
    example: 'Karrada',
  })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({
    description: 'Delivery fee in IQD',
    example: 5000,
  })
  @IsNumber()
  @Min(0, { message: 'validation.pricePositive' })
  feeIqd: number;

  @ApiProperty({
    description: 'Minimum order value in IQD',
    example: 15000,
  })
  @IsNumber()
  @Min(0, { message: 'validation.pricePositive' })
  minOrderIqd: number;

  @ApiPropertyOptional({
    description: 'Estimated delivery time in minutes',
    example: 45,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedMinutes?: number;

  @ApiPropertyOptional({
    description: 'Whether zone is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDeliveryZoneDto extends PartialType(CreateDeliveryZoneDto) {}

// ==================== STORE HOURS ====================

export class CreateStoreHoursDto {
  @ApiProperty({
    description: 'Day of week',
    enum: DayOfWeekEnum,
    example: 'SUNDAY',
  })
  @IsEnum(DayOfWeekEnum, { message: 'validation.invalidDayOfWeek' })
  dayOfWeek: string;

  @ApiProperty({
    description: 'Opening time (HH:MM format)',
    example: '08:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'validation.invalidTimeFormat',
  })
  openAt: string;

  @ApiProperty({
    description: 'Closing time (HH:MM format)',
    example: '22:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'validation.invalidTimeFormat',
  })
  closeAt: string;

  @ApiPropertyOptional({
    description: 'Whether store is closed on this day',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({
    description: 'Minutes before closing when orders stop being accepted',
    example: 60,
    default: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderCutoffMinutes?: number;
}

export class UpdateStoreHoursDto extends PartialType(CreateStoreHoursDto) {}
