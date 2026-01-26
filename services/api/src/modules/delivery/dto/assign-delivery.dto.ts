import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignDeliveryDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  @IsNotEmpty({ message: 'معرف الطلب مطلوب' })
  orderId: string;

  @ApiProperty({ example: 'driver-uuid' })
  @IsString()
  @IsNotEmpty({ message: 'معرف السائق مطلوب' })
  driverId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
