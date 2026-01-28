import { UserRole, OrderStatus, JwtPayload } from '@hypermarket/shared-types';
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all orders with filters' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'pickerId', required: false, type: String })
  @ApiQuery({ name: 'isPaid', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
  @ApiOperation({ summary: 'Get picker order queue' })
  async getPickerQueue(@CurrentUser() user: JwtPayload) {
    return this.ordersService.getPickerQueue(user.sub);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get order statistics' })
  async getStatistics() {
    return this.ordersService.getStatistics();
  }

  @Get('number/:orderNumber')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.PICKER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get order by order number' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.PICKER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new order (public - customer order)' })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PICKER)
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':id/assign-picker')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign picker to order' })
  async assignPicker(@Param('id') id: string, @Body('pickerId') pickerId: string) {
    return this.ordersService.assignPicker(id, pickerId);
  }

  @Patch(':id/mark-paid')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Mark order as paid/unpaid' })
  async markAsPaid(@Param('id') id: string, @Body('isPaid') isPaid: boolean) {
    return this.ordersService.markAsPaid(id, isPaid);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cancel an order' })
  async cancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.ordersService.cancel(id, reason);
  }
}
