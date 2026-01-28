import { UserRole } from '@hypermarket/shared-types';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiErrorResponse } from '@/common/errors';

import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all products',
    description: 'قائمة المنتجات مع الفلترة والترقيم',
  })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name/SKU' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Products list - قائمة المنتجات',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            sku: 'PROD-001',
            nameAr: 'أرز بسمتي',
            nameEn: 'Basmati Rice',
            priceIqd: 15000,
            category: { id: 'uuid', nameAr: 'أرز وحبوب' },
          },
        ],
        total: 100,
        page: 1,
        limit: 20,
      },
    },
  })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'تفاصيل منتج بالمعرّف',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Product details - تفاصيل المنتج',
    schema: {
      example: {
        id: 'uuid',
        sku: 'PROD-001',
        nameAr: 'أرز بسمتي',
        nameEn: 'Basmati Rice',
        descriptionAr: 'أرز بسمتي فاخر',
        priceIqd: 15000,
        unit: 'KG',
        imageUrl: 'https://...',
        category: { id: 'uuid', nameAr: 'أرز وحبوب' },
        inventoryQuantity: 50,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found - المنتج غير موجود',
    type: ApiErrorResponse,
  })
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get('sku/:sku')
  @Public()
  @ApiOperation({
    summary: 'Get product by SKU',
    description: 'البحث عن منتج برمز SKU',
  })
  @ApiParam({ name: 'sku', description: 'Product SKU', example: 'PROD-001' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found', type: ApiErrorResponse })
  async findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get('barcode/:barcode')
  @Public()
  @ApiOperation({
    summary: 'Get product by barcode',
    description: 'البحث عن منتج بالباركود',
  })
  @ApiParam({ name: 'barcode', description: 'Product barcode' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found', type: ApiErrorResponse })
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create product (Admin)',
    description: 'إنشاء منتج جديد - للمدير فقط',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created - تم إنشاء المنتج',
  })
  @ApiResponse({ status: 400, description: 'Validation error', type: ApiErrorResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponse })
  @ApiResponse({ status: 403, description: 'Forbidden', type: ApiErrorResponse })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update product (Admin)',
    description: 'تحديث منتج - للمدير فقط',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product updated - تم تحديث المنتج' })
  @ApiResponse({ status: 404, description: 'Product not found', type: ApiErrorResponse })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete product (Admin)',
    description: 'حذف منتج - للمدير فقط',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product deleted - تم حذف المنتج' })
  @ApiResponse({ status: 404, description: 'Product not found', type: ApiErrorResponse })
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
