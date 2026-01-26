import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUrl,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'منتجات الألبان' })
  @IsString()
  @IsNotEmpty({ message: 'اسم التصنيف بالعربية مطلوب' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Dairy Products' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({ example: 'dairy-products' })
  @IsString()
  @IsNotEmpty({ message: 'الرابط المختصر مطلوب' })
  @Matches(/^[a-z0-9-]+$/, { message: 'الرابط المختصر يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط' })
  slug: string;

  @ApiPropertyOptional({ example: 'منتجات الألبان الطازجة' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'Fresh dairy products' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'رابط الصورة غير صالح' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'parent-category-uuid' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
