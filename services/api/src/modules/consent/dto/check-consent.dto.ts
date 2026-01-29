import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * DTO for checking user consent status
 */
export class CheckConsentDto {
  @ApiProperty({
    description: 'رقم الهاتف العراقي - Iraqi phone number',
    example: '07701234567',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^07[0-9]{9}$/, {
    message: 'رقم الهاتف يجب أن يكون بصيغة 07XXXXXXXXX',
  })
  phone: string;
}
