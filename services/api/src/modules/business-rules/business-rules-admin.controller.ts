import { UserRole } from '@hypermarket/shared-types';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { PrismaService } from '@/prisma/prisma.service';
import { StructuredLogger, createLogger } from '@/common/observability';

import { PricingRulesService } from './pricing-rules.service';
import { StoreAvailabilityService, DayOfWeek } from './store-availability.service';
import {
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
  CreateStoreHoursDto,
  UpdateStoreHoursDto,
} from './dto/admin.dto';

@ApiTags('Admin - Business Rules')
@ApiBearerAuth('JWT-auth')
@Controller('admin/business-rules')
export class BusinessRulesAdminController {
  private readonly logger: StructuredLogger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingRules: PricingRulesService,
    private readonly storeAvailability: StoreAvailabilityService,
  ) {
    this.logger = createLogger('BusinessRulesAdminController');
  }

  // ==================== DELIVERY ZONES ====================

  @Get('delivery-zones')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all delivery zones (admin)' })
  async getAllDeliveryZones() {
    return this.prisma.deliveryZone.findMany({
      orderBy: { nameAr: 'asc' },
    });
  }

  @Get('delivery-zones/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get delivery zone by ID' })
  async getDeliveryZoneById(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.deliveryZone.findUniqueOrThrow({
      where: { id },
    });
  }

  @Post('delivery-zones')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create delivery zone' })
  async createDeliveryZone(@Body() dto: CreateDeliveryZoneDto) {
    const zone = await this.prisma.deliveryZone.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        feeIqd: dto.feeIqd,
        minOrderIqd: dto.minOrderIqd,
        estimatedMinutes: dto.estimatedMinutes,
        isActive: dto.isActive ?? true,
      },
    });

    await this.pricingRules.invalidateCache();
    this.logger.log('Delivery zone created', { zoneId: zone.id, name: zone.nameAr });

    return zone;
  }

  @Put('delivery-zones/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update delivery zone' })
  async updateDeliveryZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryZoneDto,
  ) {
    const zone = await this.prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.feeIqd !== undefined && { feeIqd: dto.feeIqd }),
        ...(dto.minOrderIqd !== undefined && { minOrderIqd: dto.minOrderIqd }),
        ...(dto.estimatedMinutes !== undefined && { estimatedMinutes: dto.estimatedMinutes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.pricingRules.invalidateCache();
    this.logger.log('Delivery zone updated', { zoneId: zone.id });

    return zone;
  }

  @Delete('delivery-zones/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete delivery zone' })
  async deleteDeliveryZone(@Param('id', ParseUUIDPipe) id: string) {
    await this.prisma.deliveryZone.delete({
      where: { id },
    });

    await this.pricingRules.invalidateCache();
    this.logger.log('Delivery zone deleted', { zoneId: id });

    return { success: true };
  }

  // ==================== STORE HOURS ====================

  @Get('store-hours')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all store hours (admin)' })
  async getAllStoreHours() {
    return this.prisma.storeHours.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  @Post('store-hours')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create or update store hours for a day' })
  async upsertStoreHours(@Body() dto: CreateStoreHoursDto) {
    const hours = await this.prisma.storeHours.upsert({
      where: { dayOfWeek: dto.dayOfWeek as DayOfWeek },
      create: {
        dayOfWeek: dto.dayOfWeek as DayOfWeek,
        openAt: dto.openAt,
        closeAt: dto.closeAt,
        isClosed: dto.isClosed ?? false,
        orderCutoffMinutes: dto.orderCutoffMinutes ?? 60,
      },
      update: {
        openAt: dto.openAt,
        closeAt: dto.closeAt,
        isClosed: dto.isClosed,
        orderCutoffMinutes: dto.orderCutoffMinutes,
      },
    });

    await this.storeAvailability.invalidateCache();
    this.logger.log('Store hours updated', { day: dto.dayOfWeek });

    return hours;
  }

  @Put('store-hours/:dayOfWeek')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update store hours for a specific day' })
  async updateStoreHours(
    @Param('dayOfWeek') dayOfWeek: string,
    @Body() dto: UpdateStoreHoursDto,
  ) {
    const hours = await this.prisma.storeHours.update({
      where: { dayOfWeek: dayOfWeek as DayOfWeek },
      data: {
        ...(dto.openAt !== undefined && { openAt: dto.openAt }),
        ...(dto.closeAt !== undefined && { closeAt: dto.closeAt }),
        ...(dto.isClosed !== undefined && { isClosed: dto.isClosed }),
        ...(dto.orderCutoffMinutes !== undefined && { orderCutoffMinutes: dto.orderCutoffMinutes }),
      },
    });

    await this.storeAvailability.invalidateCache();
    this.logger.log('Store hours updated', { day: dayOfWeek });

    return hours;
  }

  @Post('store-hours/init-defaults')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Initialize default store hours for all days' })
  async initDefaultStoreHours() {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    const defaultHours = {
      openAt: '08:00',
      closeAt: '22:00',
      isClosed: false,
      orderCutoffMinutes: 60,
    };

    const results = await Promise.all(
      days.map((day) =>
        this.prisma.storeHours.upsert({
          where: { dayOfWeek: day },
          create: {
            dayOfWeek: day,
            ...defaultHours,
            // Friday closed by default (Iraqi weekend)
            isClosed: day === 'FRIDAY',
          },
          update: {},
        }),
      ),
    );

    await this.storeAvailability.invalidateCache();
    this.logger.log('Default store hours initialized');

    return results;
  }
}
