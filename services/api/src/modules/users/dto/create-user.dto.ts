import { UserRole } from '@hypermarket/shared-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches, IsEnum } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name in Arabic',
    example: 'أحمد محمد',
  })
  @IsString({ message: 'الاسم يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم مطلوب' })
  fullName: string;

  @ApiProperty({
    description: 'Phone number (Iraqi format)',
    example: '07701234567',
  })
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @Matches(/^07[0-9]{9}$/, { message: 'رقم الهاتف غير صالح' })
  phone: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'Password123',
  })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً' })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.PICKER,
  })
  @IsEnum(UserRole, { message: 'الدور غير صالح' })
  role: UserRole;
}
