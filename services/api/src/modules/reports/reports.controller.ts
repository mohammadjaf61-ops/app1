import { UserRole } from '@hypermarket/shared-types';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';

import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get sales report with POS/Delivery breakdown' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date string' })
  async getSalesReport(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.reportsService.getSalesReport({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('sales/summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get detailed sales summary report' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  async getSalesSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportsService.getSalesSummary({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      categoryId,
    });
  }

  @Get('top-products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['quantity', 'revenue'],
    description: 'Sort by quantity or revenue',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products' })
  async getTopProducts(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: 'quantity' | 'revenue',
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopProducts({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      sortBy,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get('inventory')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get inventory status report (low stock, out of stock)' })
  async getInventoryStatus() {
    return this.reportsService.getInventoryStatus();
  }

  @Get('sales/daily')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiQuery({ name: 'dateFrom', required: true, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: true, type: String, description: 'ISO date string' })
  async getDailySales(@Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    return this.reportsService.getDailySales({
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });
  }

  @Get('stock/aging')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get stock aging report' })
  async getStockAging() {
    return this.reportsService.getStockAging();
  }

  @Get('category/performance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get category/department performance report' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date string' })
  async getCategoryPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getCategoryPerformance({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('driver/performance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get driver performance report' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date string' })
  async getDriverPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getDriverPerformance({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('picker/performance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get picker performance report' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date string' })
  async getPickerPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getPickerPerformance({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }
}
