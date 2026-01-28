import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FailDeliveryDto {
  @ApiProperty({ description: 'Reason for delivery failure' })
  @IsString()
  @IsNotEmpty({ message: 'سبب الفشل مطلوب' })
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
