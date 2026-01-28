import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches, IsOptional, IsEmail } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Iraqi phone number (07XXXXXXXXX)',
    example: '07701234567',
  })
  @IsString()
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @Matches(/^07[3-9]\d{8}$/, { message: 'رقم الهاتف غير صالح' })
  phoneNumber: string;

  @ApiProperty({
    description: 'First name in Arabic or English',
    example: 'أحمد',
  })
  @IsString()
  @IsNotEmpty({ message: 'الاسم الأول مطلوب' })
  @MinLength(2, { message: 'الاسم الأول يجب أن يكون حرفين على الأقل' })
  firstName: string;

  @ApiProperty({
    description: 'Last name in Arabic or English',
    example: 'محمد',
  })
  @IsString()
  @IsNotEmpty({ message: 'الاسم الأخير مطلوب' })
  @MinLength(2, { message: 'الاسم الأخير يجب أن يكون حرفين على الأقل' })
  lastName: string;

  @ApiProperty({
    description: 'Password (min 8 characters)',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  password: string;

  @ApiPropertyOptional({
    description: 'Email address (optional)',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email?: string;
}
