import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, IsBoolean, Min, IsUrl } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product SKU',
    example: 'RICE-001',
  })
  @IsOptional()
  @IsString({ message: 'رمز المنتج يجب أن يكون نصاً' })
  sku?: string;

  @ApiPropertyOptional({
    description: 'Product barcode',
    example: '1234567890123',
  })
  @IsOptional()
  @IsString({ message: 'الباركود يجب أن يكون نصاً' })
  barcode?: string | null;

  @ApiPropertyOptional({
    description: 'Product name in Arabic',
    example: 'أرز بسمتي 5 كغم',
  })
  @IsOptional()
  @IsString({ message: 'اسم المنتج يجب أن يكون نصاً' })
  nameAr?: string;

  @ApiPropertyOptional({
    description: 'Product description in Arabic',
    example: 'أرز بسمتي فاخر من الهند',
  })
  @IsOptional()
  @IsString({ message: 'وصف المنتج يجب أن يكون نصاً' })
  descriptionAr?: string | null;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'رابط الصورة غير صالح' })
  imageUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID('4', { message: 'معرّف الفئة غير صالح' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Cost price in IQD',
    example: 5000,
  })
  @IsOptional()
  @IsInt({ message: 'سعر التكلفة يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'سعر التكلفة يجب أن يكون أكبر من أو يساوي صفر' })
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Sale price in IQD',
    example: 7500,
  })
  @IsOptional()
  @IsInt({ message: 'سعر البيع يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'سعر البيع يجب أن يكون أكبر من أو يساوي صفر' })
  salePrice?: number;

  @ApiPropertyOptional({
    description: 'Is product active',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون صحيحة أو خاطئة' })
  isActive?: boolean;
}
