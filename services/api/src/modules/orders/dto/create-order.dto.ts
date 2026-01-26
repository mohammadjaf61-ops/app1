import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'uuid-here',
  })
  @IsUUID('4', { message: 'معرّف المنتج غير صالح' })
  productId: string;

  @ApiProperty({
    description: 'Quantity',
    example: 2,
  })
  @IsInt({ message: 'الكمية يجب أن تكون رقماً صحيحاً' })
  @Min(1, { message: 'الكمية يجب أن تكون واحد على الأقل' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Customer name',
    example: 'أحمد محمد',
  })
  @IsString({ message: 'اسم العميل يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم العميل مطلوب' })
  customerName: string;

  @ApiProperty({
    description: 'Customer phone (Iraqi format)',
    example: '07701234567',
  })
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @Matches(/^07[0-9]{9}$/, { message: 'رقم الهاتف غير صالح' })
  customerPhone: string;

  @ApiProperty({
    description: 'Delivery address (free text)',
    example: 'بغداد، الكرادة، شارع الأميرات، بناية 5، طابق 3',
  })
  @IsString({ message: 'عنوان التوصيل يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان التوصيل مطلوب' })
  deliveryAddressText: string;

  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
  })
  @IsArray({ message: 'المنتجات يجب أن تكون مصفوفة' })
  @ArrayMinSize(1, { message: 'يجب إضافة منتج واحد على الأقل' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({
    description: 'Order notes',
    example: 'الرجاء الاتصال قبل التوصيل',
  })
  @IsOptional()
  @IsString({ message: 'الملاحظات يجب أن تكون نصاً' })
  notes?: string;
}
