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

import { DeliveryService } from './delivery.service';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { FailDeliveryDto } from './dto/fail-delivery.dto';
import { DeliveryQueryDto } from './dto/delivery-query.dto';

@ApiTags('delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all deliveries (admin only)' })
  async findAll(@Query() query: DeliveryQueryDto) {
    return this.deliveryService.findAll(query);
  }

  @Get('driver/queue')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get driver delivery queue' })
  async getDriverQueue(@CurrentUser('sub') driverId: string) {
    return this.deliveryService.getDriverQueue(driverId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by ID' })
  async findById(@Param('id') id: string) {
    return this.deliveryService.findById(id);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign delivery to driver' })
  async assign(@Body() dto: AssignDeliveryDto) {
    return this.deliveryService.assign(dto);
  }

  @Patch(':id/pickup')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Mark delivery as picked up from store' })
  async pickup(@Param('id') id: string) {
    return this.deliveryService.pickup(id);
  }

  @Patch(':id/start')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Start delivery (in transit)' })
  async start(@Param('id') id: string) {
    return this.deliveryService.startDelivery(id);
  }

  @Patch(':id/arrive')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Mark arrival at delivery location' })
  async arrive(@Param('id') id: string) {
    return this.deliveryService.arrive(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Complete delivery' })
  async complete(@Param('id') id: string, @Body() dto: CompleteDeliveryDto) {
    return this.deliveryService.complete(id, dto);
  }

  @Patch(':id/fail')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Mark delivery as failed' })
  async fail(@Param('id') id: string, @Body() dto: FailDeliveryDto) {
    return this.deliveryService.fail(id, dto);
  }
}
