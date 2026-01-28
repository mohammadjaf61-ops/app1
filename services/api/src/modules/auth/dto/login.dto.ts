import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Phone number (Iraqi format)',
    example: '07701234567',
  })
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @Matches(/^07[0-9]{9}$/, { message: 'رقم الهاتف غير صالح' })
  phone: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123',
  })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً' })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  password: string;
}
