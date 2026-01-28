import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators/public.decorator';

import { PaymentResponseDto } from './dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Get payment by order ID (public - for customer to check status)
   */
  @Get('order/:orderId')
  @Public()
  @ApiOperation({
    summary: 'Get payment by order ID',
    description: 'Retrieve payment status for an order. Used by customers to check payment status.',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment found',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getByOrderId(@Param('orderId') orderId: string) {
    const payment = await this.paymentsService.getByOrderId(orderId);

    return {
      id: payment.id,
      orderId: payment.orderId,
      method: payment.method,
      status: payment.status,
      amountIqd: payment.amountIqd,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }

  /**
   * Get available payment methods
   */
  @Get('methods')
  @Public()
  @ApiOperation({
    summary: 'Get available payment methods',
    description: 'Returns list of available payment methods for checkout',
  })
  @ApiResponse({
    status: 200,
    description: 'Available payment methods',
  })
  getAvailableMethods() {
    // Currently only COD is available
    return {
      methods: [
        {
          id: 'COD',
          nameAr: 'الدفع عند الاستلام',
          nameEn: 'Cash on Delivery',
          isAvailable: true,
          description: 'Pay when you receive your order',
        },
        {
          id: 'CARD',
          nameAr: 'الدفع بالبطاقة',
          nameEn: 'Card Payment',
          isAvailable: false,
          description: 'Coming soon',
        },
      ],
    };
  }
}
