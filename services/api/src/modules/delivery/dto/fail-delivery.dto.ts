import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { DeliveryFailureReason } from '@hypermarket/shared-types';

export class FailDeliveryDto {
  @ApiProperty({ enum: DeliveryFailureReason })
  @IsEnum(DeliveryFailureReason, { message: 'سبب الفشل غير صالح' })
  reason: DeliveryFailureReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
