import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  Min,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product SKU (unique)',
    example: 'RICE-001',
  })
  @IsString({ message: 'رمز المنتج يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رمز المنتج مطلوب' })
  sku: string;

  @ApiPropertyOptional({
    description: 'Product barcode (EAN/UPC)',
    example: '1234567890123',
  })
  @IsOptional()
  @IsString({ message: 'الباركود يجب أن يكون نصاً' })
  barcode?: string;

  @ApiProperty({
    description: 'Product name in Arabic',
    example: 'أرز بسمتي 5 كغم',
  })
  @IsString({ message: 'اسم المنتج يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم المنتج مطلوب' })
  nameAr: string;

  @ApiPropertyOptional({
    description: 'Product description in Arabic',
    example: 'أرز بسمتي فاخر من الهند',
  })
  @IsOptional()
  @IsString({ message: 'وصف المنتج يجب أن يكون نصاً' })
  descriptionAr?: string;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'رابط الصورة غير صالح' })
  imageUrl?: string;

  @ApiProperty({
    description: 'Category ID',
    example: 'uuid-here',
  })
  @IsUUID('4', { message: 'معرّف الفئة غير صالح' })
  @IsNotEmpty({ message: 'الفئة مطلوبة' })
  categoryId: string;

  @ApiProperty({
    description: 'Cost price in IQD',
    example: 5000,
  })
  @IsInt({ message: 'سعر التكلفة يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'سعر التكلفة يجب أن يكون أكبر من أو يساوي صفر' })
  costPrice: number;

  @ApiProperty({
    description: 'Sale price in IQD',
    example: 7500,
  })
  @IsInt({ message: 'سعر البيع يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'سعر البيع يجب أن يكون أكبر من أو يساوي صفر' })
  salePrice: number;

  @ApiPropertyOptional({
    description: 'Is product active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون صحيحة أو خاطئة' })
  isActive?: boolean;
}
