import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';

export class UpdateInventoryDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'uuid-here',
  })
  @IsUUID('4', { message: 'معرّف المنتج غير صالح' })
  @IsNotEmpty({ message: 'معرّف المنتج مطلوب' })
  productId: string;

  @ApiProperty({
    description: 'Location ID',
    example: 'uuid-here',
  })
  @IsUUID('4', { message: 'معرّف الموقع غير صالح' })
  @IsNotEmpty({ message: 'معرّف الموقع مطلوب' })
  locationId: string;

  @ApiProperty({
    description: 'Quantity to set or adjust',
    example: 100,
  })
  @IsInt({ message: 'الكمية يجب أن تكون رقماً صحيحاً' })
  @Min(0, { message: 'الكمية يجب أن تكون أكبر من أو تساوي صفر' })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Expiry date (ISO format)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'تاريخ الصلاحية غير صالح' })
  expiryDate?: string;
}

export class AdjustInventoryDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'uuid-here',
  })
  @IsUUID('4', { message: 'معرّف المنتج غير صالح' })
  productId: string;

  @ApiProperty({
    description: 'Location ID',
    example: 'uuid-here',
  })
  @IsUUID('4', { message: 'معرّف الموقع غير صالح' })
  locationId: string;

  @ApiProperty({
    description: 'Quantity adjustment (positive to add, negative to subtract)',
    example: -5,
  })
  @IsInt({ message: 'التعديل يجب أن يكون رقماً صحيحاً' })
  adjustment: number;

  @ApiPropertyOptional({
    description: 'Reason for adjustment',
    example: 'تالف',
  })
  @IsOptional()
  @IsString({ message: 'السبب يجب أن يكون نصاً' })
  reason?: string;
}
