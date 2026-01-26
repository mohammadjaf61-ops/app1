import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1, { message: 'الكمية يجب أن تكون 1 على الأقل' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'يجب إضافة منتج واحد على الأقل' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'address-uuid' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان التوصيل مطلوب' })
  deliveryAddressId: string;

  @ApiPropertyOptional({ example: 'يرجى الاتصال قبل الوصول' })
  @IsOptional()
  @IsString()
  notes?: string;
}
