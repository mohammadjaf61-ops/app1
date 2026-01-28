import { UserRole, DeliveryStatus, JwtPayload } from '@hypermarket/shared-types';
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

import { DeliveryService } from './delivery.service';

@ApiTags('delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all deliveries with filters' })
  @ApiQuery({ name: 'status', required: false, enum: DeliveryStatus })
  @ApiQuery({ name: 'driverId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: DeliveryStatus,
    @Query('driverId') driverId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.deliveryService.findAll({ status, driverId, page, limit });
  }

  @Get('driver/queue')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get driver delivery queue' })
  async getDriverQueue(@CurrentUser() user: JwtPayload) {
    return this.deliveryService.getDriverQueue(user.sub);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get delivery statistics' })
  @ApiQuery({ name: 'driverId', required: false, type: String })
  async getStatistics(@Query('driverId') driverId?: string) {
    return this.deliveryService.getStatistics(driverId);
  }

  @Get('driver/statistics')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get current driver statistics' })
  async getDriverStatistics(@CurrentUser() user: JwtPayload) {
    return this.deliveryService.getStatistics(user.sub);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get delivery by ID' })
  async findById(@Param('id') id: string) {
    return this.deliveryService.findById(id);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign delivery to driver' })
  async assign(@Body('orderId') orderId: string, @Body('driverId') driverId: string) {
    return this.deliveryService.assign(orderId, driverId);
  }

  @Patch(':id/pickup')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Mark delivery as picked up from store' })
  async pickup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.deliveryService.pickup(id, user.sub);
  }

  @Patch(':id/start')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Start delivery (in transit)' })
  async start(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.deliveryService.startDelivery(id, user.sub);
  }

  @Patch(':id/complete')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Complete delivery' })
  async complete(
    @Param('id') id: string,
    @Body('collectedAmount') collectedAmount: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.deliveryService.complete(id, user.sub, collectedAmount);
  }

  @Patch(':id/fail')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Mark delivery as failed' })
  async fail(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.deliveryService.fail(id, user.sub, reason);
  }
}
