import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsBoolean, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name in Arabic',
    example: 'المواد الغذائية',
  })
  @IsString({ message: 'اسم الفئة يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم الفئة مطلوب' })
  nameAr: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for subcategories',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID('4', { message: 'معرّف الفئة الأب غير صالح' })
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'ترتيب الفرز يجب أن يكون رقماً صحيحاً' })
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Is category active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون صحيحة أو خاطئة' })
  isActive?: boolean;
}
