import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { UserRole } from '@hypermarket/shared-types';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all orders (admin only)' })
  async findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('my-orders')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get current customer orders' })
  async getMyOrders(
    @CurrentUser('sub') customerId: string,
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.findByCustomer(customerId, query);
  }

  @Get('picker/queue')
  @Roles(UserRole.PICKER)
  @ApiOperation({ summary: 'Get picker order queue' })
  async getPickerQueue(@CurrentUser('sub') pickerId: string) {
    return this.ordersService.getPickerQueue(pickerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new order' })
  async create(
    @CurrentUser('sub') customerId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(customerId, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.PICKER)
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':id/assign-picker')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign picker to order' })
  async assignPicker(
    @Param('id') id: string,
    @Body('pickerId') pickerId: string,
  ) {
    return this.ordersService.assignPicker(id, pickerId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.ordersService.cancel(id, reason, userId);
  }
}
