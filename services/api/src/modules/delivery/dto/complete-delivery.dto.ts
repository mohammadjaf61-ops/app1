import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteDeliveryDto {
  @ApiProperty({ example: 50000, description: 'Amount collected from customer in IQD' })
  @IsNumber()
  @Min(0, { message: 'المبلغ المحصل يجب أن يكون أكبر من أو يساوي صفر' })
  collectedAmount: number;

  @ApiPropertyOptional({ description: 'Customer signature as base64' })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
