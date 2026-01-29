import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Public } from '@/common/decorators/public.decorator';

import { BusinessRulesService } from './business-rules.service';
import {
  ValidateOrderDto,
  DeliveryZoneResponseDto,
  StoreHoursResponseDto,
  StoreAvailabilityResponseDto,
  OrderValidationResponseDto,
} from './dto';
import { PricingRulesService } from './pricing-rules.service';
import { StoreAvailabilityService } from './store-availability.service';

@ApiTags('Business Rules')
@Controller('business-rules')
export class BusinessRulesController {
  constructor(
    private readonly businessRules: BusinessRulesService,
    private readonly pricingRules: PricingRulesService,
    private readonly storeAvailability: StoreAvailabilityService,
  ) {}

  /**
   * Get all active delivery zones
   * Public endpoint for displaying zones in checkout
   */
  @Get('delivery-zones')
  @Public()
  @ApiOperation({ summary: 'Get active delivery zones' })
  @ApiResponse({
    status: 200,
    description: 'List of delivery zones',
    type: [DeliveryZoneResponseDto],
  })
  async getDeliveryZones(): Promise<DeliveryZoneResponseDto[]> {
    return this.pricingRules.getActiveDeliveryZones();
  }

  /**
   * Get store hours for all days
   * Public endpoint for displaying store hours
   */
  @Get('store-hours')
  @Public()
  @ApiOperation({ summary: 'Get store working hours' })
  @ApiResponse({
    status: 200,
    description: 'Store hours for each day',
    type: [StoreHoursResponseDto],
  })
  async getStoreHours(): Promise<StoreHoursResponseDto[]> {
    return this.storeAvailability.getAllStoreHours();
  }

  /**
   * Check current store availability
   * Public endpoint for real-time status
   */
  @Get('store-availability')
  @Public()
  @ApiOperation({ summary: 'Check if store is currently open and accepting orders' })
  @ApiResponse({
    status: 200,
    description: 'Store availability status',
    type: StoreAvailabilityResponseDto,
  })
  async checkStoreAvailability(): Promise<StoreAvailabilityResponseDto> {
    return this.storeAvailability.canPlaceOrder();
  }

  /**
   * Validate order before submission
   * Public endpoint for checkout validation
   */
  @Post('validate-order')
  @Public()
  @ApiOperation({ summary: 'Validate order against business rules' })
  @ApiResponse({ status: 200, description: 'Validation result', type: OrderValidationResponseDto })
  async validateOrder(@Body() dto: ValidateOrderDto): Promise<OrderValidationResponseDto> {
    return this.businessRules.validateOrder({
      subtotalIqd: dto.subtotalIqd,
      deliveryZoneId: dto.deliveryZoneId,
    });
  }
}
