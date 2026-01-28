import { UserRole, OrderStatus, JwtPayload } from '@hypermarket/shared-types';
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiErrorResponse } from '@/common/errors';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({
    summary: 'Get all orders',
    description: 'قائمة الطلبات مع الفلترة والترقيم',
  })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'pickerId', required: false, type: String, description: 'Filter by picker' })
  @ApiQuery({
    name: 'isPaid',
    required: false,
    type: Boolean,
    description: 'Filter by payment status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by order number',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Orders list - قائمة الطلبات',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            orderNumber: 'ORD-2026-001',
            status: 'PENDING',
            totalAmountIqd: 50000,
            customerPhone: '07712345678',
            createdAt: '2026-01-28T10:00:00.000Z',
          },
        ],
        total: 100,
        page: 1,
        limit: 20,
      },
    },
  })
  async findAll(
    @Query('status') status?: OrderStatus,
    @Query('pickerId') pickerId?: string,
    @Query('isPaid') isPaid?: boolean,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findAll({
      status,
      pickerId,
      isPaid,
      search,
      page,
      limit,
    });
  }

  @Get('picker/queue')
  @Roles(UserRole.PICKER)
  @ApiOperation({
    summary: 'Get picker queue',
    description: 'قائمة طلبات الجامع الحالي',
  })
  @ApiResponse({
    status: 200,
    description: 'Picker orders queue',
  })
  async getPickerQueue(@CurrentUser() user: JwtPayload) {
    return this.ordersService.getPickerQueue(user.sub);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get order statistics',
    description: 'إحصائيات الطلبات',
  })
  @ApiResponse({
    status: 200,
    description: 'Order statistics',
    schema: {
      example: {
        totalOrders: 1500,
        pendingOrders: 25,
        completedToday: 42,
        revenueToday: 5000000,
      },
    },
  })
  async getStatistics() {
    return this.ordersService.getStatistics();
  }

  @Get('number/:orderNumber')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.PICKER, UserRole.DRIVER)
  @ApiOperation({
    summary: 'Get order by number',
    description: 'البحث عن طلب برقم الطلب',
  })
  @ApiParam({ name: 'orderNumber', description: 'Order number', example: 'ORD-2026-001' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found', type: ApiErrorResponse })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.PICKER, UserRole.DRIVER)
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'تفاصيل طلب بالمعرّف',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Order details - تفاصيل الطلب',
    schema: {
      example: {
        id: 'uuid',
        orderNumber: 'ORD-2026-001',
        status: 'PICKING',
        totalAmountIqd: 50000,
        items: [{ productId: 'uuid', productName: 'أرز بسمتي', quantity: 2, priceIqd: 15000 }],
        customer: { phone: '07712345678', name: 'علي' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found', type: ApiErrorResponse })
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post()
  @Public()
  @ApiOperation({
    summary: 'Create order (Customer)',
    description: 'إنشاء طلب جديد - للعملاء',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created - تم إنشاء الطلب',
    schema: {
      example: {
        id: 'uuid',
        orderNumber: 'ORD-2026-001',
        status: 'PENDING',
        totalAmountIqd: 50000,
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Out of stock - المنتج غير متوفر',
    type: ApiErrorResponse,
  })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PICKER)
  @ApiOperation({
    summary: 'Update order status',
    description: 'تحديث حالة الطلب',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Status updated - تم تحديث الحالة' })
  @ApiResponse({
    status: 422,
    description: 'Invalid status transition',
    type: ApiErrorResponse,
  })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':id/assign-picker')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Assign picker',
    description: 'تعيين جامع للطلب',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ schema: { example: { pickerId: 'picker-uuid' } } })
  @ApiResponse({ status: 200, description: 'Picker assigned - تم تعيين الجامع' })
  async assignPicker(@Param('id') id: string, @Body('pickerId') pickerId: string) {
    return this.ordersService.assignPicker(id, pickerId);
  }

  @Patch(':id/mark-paid')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({
    summary: 'Mark as paid',
    description: 'تحديث حالة الدفع',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ schema: { example: { isPaid: true } } })
  @ApiResponse({ status: 200, description: 'Payment status updated - تم تحديث حالة الدفع' })
  async markAsPaid(@Param('id') id: string, @Body('isPaid') isPaid: boolean) {
    return this.ordersService.markAsPaid(id, isPaid);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Cancel order',
    description: 'إلغاء طلب',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ schema: { example: { reason: 'Customer request' } } })
  @ApiResponse({ status: 200, description: 'Order cancelled - تم إلغاء الطلب' })
  @ApiResponse({
    status: 422,
    description: 'Cannot cancel order',
    type: ApiErrorResponse,
  })
  async cancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.ordersService.cancel(id, reason);
  }
}
