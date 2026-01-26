import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name in Arabic',
    example: 'المواد الغذائية',
  })
  @IsOptional()
  @IsString({ message: 'اسم الفئة يجب أن يكون نصاً' })
  nameAr?: string;

  @ApiPropertyOptional({
    description: 'Parent category ID',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID('4', { message: 'معرّف الفئة الأب غير صالح' })
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'ترتيب الفرز يجب أن يكون رقماً صحيحاً' })
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Is category active',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون صحيحة أو خاطئة' })
  isActive?: boolean;
}
