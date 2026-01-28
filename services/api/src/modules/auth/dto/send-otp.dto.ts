import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number (Iraqi format)',
    example: '07701234567',
  })
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @Matches(/^07[0-9]{9}$/, { message: 'رقم الهاتف غير صالح' })
  phone: string;
}
