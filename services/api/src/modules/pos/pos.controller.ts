import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { UserRole } from '@hypermarket/shared-types';

import {
  CreatePosOrderDto,
  PosOrderResponseDto,
  PosSessionStatsDto,
  ProductLookupResponseDto,
} from './dto';
import { PosService } from './pos.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('POS - Point of Sale')
@Controller('pos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PosController {
  constructor(private readonly posService: PosService) {}

  /**
   * Look up product by SKU or barcode
   */
  @Get('products/lookup/:sku')
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Look up product by SKU',
    description: 'Quick product lookup for POS. Used when scanning barcode or entering SKU.',
  })
  @ApiParam({ name: 'sku', description: 'Product SKU or barcode' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: ProductLookupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async lookupProduct(@Param('sku') sku: string): Promise<ProductLookupResponseDto> {
    return this.posService.lookupProduct(sku);
  }

  /**
   * Create POS order (sale)
   */
  @Post('orders')
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Create POS order',
    description:
      'Create a point-of-sale order. Payment is instant (CASH/PAID). Inventory is deducted immediately.',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: PosOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient stock' })
  async createOrder(
    @Body() dto: CreatePosOrderDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PosOrderResponseDto> {
    return this.posService.createOrder(dto, req.user.id);
  }

  /**
   * Get order by order number (for receipt)
   */
  @Get('orders/:orderNumber')
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get POS order by order number',
    description: 'Retrieve order details for receipt reprint or review.',
  })
  @ApiParam({ name: 'orderNumber', description: 'Order number (e.g., POS-20250128-00001)' })
  @ApiResponse({
    status: 200,
    description: 'Order found',
    type: PosOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('orderNumber') orderNumber: string): Promise<PosOrderResponseDto> {
    return this.posService.getOrderByNumber(orderNumber);
  }

  /**
   * Get cashier session statistics
   */
  @Get('stats')
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get session statistics',
    description: "Get current cashier's session statistics for today.",
  })
  @ApiResponse({
    status: 200,
    description: 'Session statistics',
    type: PosSessionStatsDto,
  })
  async getSessionStats(@Req() req: AuthenticatedRequest): Promise<PosSessionStatsDto> {
    return this.posService.getSessionStats(req.user.id);
  }

  /**
   * Get recent orders for current cashier
   */
  @Get('orders')
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get recent POS orders',
    description: "Get current cashier's recent orders.",
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of orders to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent orders',
  })
  async getRecentOrders(@Req() req: AuthenticatedRequest, @Query('limit') limit?: number) {
    return this.posService.getRecentOrders(req.user.id, limit || 10);
  }
}
