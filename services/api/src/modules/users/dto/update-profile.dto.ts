import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'First name',
    example: 'أحمد',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'الاسم الأول يجب أن يكون حرفين على الأقل' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'محمد',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'الاسم الأخير يجب أن يكون حرفين على الأقل' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email?: string;
}
