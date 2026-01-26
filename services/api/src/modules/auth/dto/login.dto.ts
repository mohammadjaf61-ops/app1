import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Iraqi phone number (07XXXXXXXXX)',
    example: '07701234567',
  })
  @IsString()
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  phoneNumber: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  password: string;
}
