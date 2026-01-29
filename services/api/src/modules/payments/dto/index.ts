import { PaymentMethod, PaymentStatus } from '@hypermarket/shared-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for marking payment as paid
 */
export class MarkPaymentPaidDto {
  // No body needed - paidBy comes from authenticated user
}

/**
 * DTO for marking payment as failed
 */
export class MarkPaymentFailedDto {
  @ApiProperty({
    description: 'Reason for failure',
    example: 'Customer refused to pay',
  })
  @IsString({ message: 'validation.reasonMustBeString' })
  @IsNotEmpty({ message: 'validation.reasonRequired' })
  reason: string;
}

/**
 * DTO for payment list filters (admin)
 */
export class PaymentFiltersDto {
  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Filter by payment status',
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'validation.invalidPaymentStatus' })
  status?: PaymentStatus;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Filter by payment method',
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'validation.invalidPaymentMethod' })
  method?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Filter by order ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'validation.invalidOrderId' })
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  limit?: number;
}

/**
 * Response DTO for payment
 */
export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  id: string;

  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, description: 'Payment status' })
  status: PaymentStatus;

  @ApiProperty({ description: 'Amount in IQD' })
  amountIqd: number;

  @ApiPropertyOptional({ description: 'Provider reference (for card payments)' })
  providerRef?: string;

  @ApiPropertyOptional({ description: 'Payment provider name' })
  providerName?: string;

  @ApiPropertyOptional({ description: 'When payment was confirmed' })
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Who confirmed the payment' })
  paidBy?: string;

  @ApiPropertyOptional({ description: 'Failure reason if failed' })
  failureReason?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

/**
 * Response DTO for payment statistics
 */
export class PaymentStatsResponseDto {
  @ApiProperty({ description: 'Total number of payments' })
  totalPayments: number;

  @ApiProperty({ description: 'Pending payments count' })
  pendingPayments: number;

  @ApiProperty({ description: 'Paid payments count' })
  paidPayments: number;

  @ApiProperty({ description: 'Failed payments count' })
  failedPayments: number;

  @ApiProperty({ description: 'Total paid amount in IQD' })
  totalPaidAmountIqd: number;

  @ApiProperty({ description: 'Total pending amount in IQD' })
  totalPendingAmountIqd: number;
}
