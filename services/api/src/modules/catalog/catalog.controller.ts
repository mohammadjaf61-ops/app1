import { UserRole } from '@hypermarket/shared-types';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ==================== CATEGORIES ====================

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new category' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'parentId', required: false, type: String })
  async findAllCategories(
    @Query('isActive') isActive?: boolean,
    @Query('parentId') parentId?: string,
  ) {
    return this.catalogService.findAllCategories({ isActive, parentId });
  }

  @Get('categories/tree')
  @Public()
  @ApiOperation({ summary: 'Get categories as tree structure' })
  async getCategoryTree() {
    return this.catalogService.getCategoryTree();
  }

  @Get('categories/:id')
  @Public()
  @ApiOperation({ summary: 'Get category by ID' })
  async findCategoryById(@Param('id') id: string) {
    return this.catalogService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }

  // ==================== PRODUCTS ====================

  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new product' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Get('products')
  @Public()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAllProducts(
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.catalogService.findAllProducts({
      categoryId,
      isActive,
      search,
      minPrice,
      maxPrice,
      page,
      limit,
    });
  }

  @Get('products/sku/:sku')
  @ApiOperation({ summary: 'Get product by SKU' })
  async findProductBySku(@Param('sku') sku: string) {
    return this.catalogService.findProductBySku(sku);
  }

  @Get('products/:id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  async findProductById(@Param('id') id: string) {
    return this.catalogService.findProductById(id);
  }

  @Patch('products/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete product' })
  async deleteProduct(@Param('id') id: string) {
    return this.catalogService.deleteProduct(id);
  }

  @Patch('products/:id/activate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Activate product' })
  async activateProduct(@Param('id') id: string) {
    return this.catalogService.toggleProductActive(id, true);
  }

  @Patch('products/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Deactivate product' })
  async deactivateProduct(@Param('id') id: string) {
    return this.catalogService.toggleProductActive(id, false);
  }
}
