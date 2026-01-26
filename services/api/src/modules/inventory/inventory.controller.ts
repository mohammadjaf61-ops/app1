import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { UserRole } from '@hypermarket/shared-types';

import { Roles } from '@/common/decorators/roles.decorator';

import { InventoryService } from './inventory.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateInventoryDto, AdjustInventoryDto } from './dto/update-inventory.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==================== LOCATIONS ====================

  @Post('locations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new inventory location' })
  async createLocation(@Body() dto: CreateLocationDto) {
    return this.inventoryService.createLocation(dto);
  }

  @Get('locations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PICKER)
  @ApiOperation({ summary: 'Get all inventory locations' })
  async findAllLocations() {
    return this.inventoryService.findAllLocations();
  }

  @Get('locations/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PICKER)
  @ApiOperation({ summary: 'Get location by ID with inventory' })
  async findLocationById(@Param('id') id: string) {
    return this.inventoryService.findLocationById(id);
  }

  @Delete('locations/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete location' })
  async deleteLocation(@Param('id') id: string) {
    return this.inventoryService.deleteLocation(id);
  }

  // ==================== INVENTORY ====================

  @Post('set')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Set inventory quantity for product at location' })
  async setInventory(@Body() dto: UpdateInventoryDto) {
    return this.inventoryService.setInventory(dto);
  }

  @Post('adjust')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PICKER)
  @ApiOperation({ summary: 'Adjust inventory quantity (add/subtract)' })
  async adjustInventory(@Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjustInventory(dto);
  }

  @Get('product/:productId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PICKER)
  @ApiOperation({ summary: 'Get inventory by product ID' })
  async getInventoryByProduct(@Param('productId') productId: string) {
    return this.inventoryService.getInventoryByProduct(productId);
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get low stock items' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: 'Default: 10' })
  async getLowStockItems(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStockItems(threshold);
  }

  @Get('near-expiry')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get items near expiry' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number, description: 'Default: 30' })
  async getNearExpiryItems(@Query('daysAhead') daysAhead?: number) {
    return this.inventoryService.getNearExpiryItems(daysAhead);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get inventory summary' })
  async getInventorySummary() {
    return this.inventoryService.getInventorySummary();
  }
}
