import { UserRole } from '@hypermarket/shared-types';
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';

import {
  MarkPaymentFailedDto,
  PaymentFiltersDto,
  PaymentResponseDto,
  PaymentStatsResponseDto,
} from './dto';
import { PaymentsService } from './payments.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('Admin - Payments')
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Get all payments with filters
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({
    summary: 'List all payments',
    description: 'Get paginated list of payments with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of payments',
  })
  async findAll(@Query() filters: PaymentFiltersDto) {
    return this.paymentsService.findAll({
      status: filters.status,
      method: filters.method,
      orderId: filters.orderId,
      page: filters.page,
      limit: filters.limit,
    });
  }

  /**
   * Get payment statistics
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get payment statistics',
    description: 'Get aggregate payment statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment statistics',
    type: PaymentStatsResponseDto,
  })
  async getStatistics() {
    return this.paymentsService.getStatistics();
  }

  /**
   * Get payment by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieve detailed payment information',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment details',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getById(@Param('id') id: string) {
    return this.paymentsService.getById(id);
  }

  /**
   * Mark payment as paid (manual COD collection)
   */
  @Post(':id/mark-paid')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.DRIVER)
  @ApiOperation({
    summary: 'Mark payment as paid',
    description: 'Mark a COD payment as collected. Used when driver collects cash.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment marked as paid',
  })
  @ApiResponse({ status: 400, description: 'Payment already paid or invalid status' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async markPaid(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.paymentsService.markPaid(id, req.user.id);
    return { success: true, message: 'تم تأكيد استلام الدفع' };
  }

  /**
   * Mark payment as failed
   */
  @Post(':id/mark-failed')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Mark payment as failed',
    description: 'Mark a payment as failed with reason. Admin/Manager only.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment marked as failed',
  })
  @ApiResponse({ status: 400, description: 'Invalid payment status' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async markFailed(
    @Param('id') id: string,
    @Body() dto: MarkPaymentFailedDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.paymentsService.markFailed(id, dto.reason, req.user.id);
    return { success: true, message: 'تم تحديث حالة الدفع إلى فشل' };
  }
}
