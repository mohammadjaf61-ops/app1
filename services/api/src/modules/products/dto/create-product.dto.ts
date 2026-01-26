import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ProductUnit } from '@hypermarket/shared-types';

export class CreateProductDto {
  @ApiProperty({ example: 'PRD-001234' })
  @IsString()
  @IsNotEmpty({ message: 'رمز المنتج مطلوب' })
  sku: string;

  @ApiPropertyOptional({ example: '6281001234567' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 'حليب طازج' })
  @IsString()
  @IsNotEmpty({ message: 'اسم المنتج بالعربية مطلوب' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Fresh Milk' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ example: 'حليب طازج كامل الدسم' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'Full fat fresh milk' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  @IsNotEmpty({ message: 'التصنيف مطلوب' })
  categoryId: string;

  @ApiProperty({ example: 2500, description: 'Price in IQD' })
  @IsNumber()
  @Min(0, { message: 'السعر يجب أن يكون أكبر من أو يساوي صفر' })
  price: number;

  @ApiPropertyOptional({ example: 3000, description: 'Compare at price in IQD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0, { message: 'الكمية يجب أن تكون أكبر من أو تساوي صفر' })
  stockQuantity: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiProperty({ example: 'A1', description: 'Aisle location' })
  @IsString()
  @IsNotEmpty({ message: 'رقم الممر مطلوب' })
  aisle: string;

  @ApiProperty({ example: '3', description: 'Shelf number' })
  @IsString()
  @IsNotEmpty({ message: 'رقم الرف مطلوب' })
  shelf: string;

  @ApiPropertyOptional({ example: 'B', description: 'Bin location' })
  @IsOptional()
  @IsString()
  bin?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Weight in grams' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({ enum: ProductUnit, example: ProductUnit.LITER })
  @IsEnum(ProductUnit, { message: 'وحدة القياس غير صالحة' })
  unit: ProductUnit;

  @ApiProperty({ example: 1, description: 'Unit value (e.g., 1 for 1 liter)' })
  @IsNumber()
  @Min(0)
  unitValue: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
