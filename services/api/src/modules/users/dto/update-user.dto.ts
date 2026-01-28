import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Full name in Arabic',
    example: 'أحمد محمد',
  })
  @IsOptional()
  @IsString({ message: 'الاسم يجب أن يكون نصاً' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Phone number (Iraqi format)',
    example: '07701234567',
  })
  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  @Matches(/^07[0-9]{9}$/, { message: 'رقم الهاتف غير صالح' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Is user active',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون صحيحة أو خاطئة' })
  isActive?: boolean;
}
