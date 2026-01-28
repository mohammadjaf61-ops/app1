import { UserRole } from '@hypermarket/shared-types';
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiErrorResponse } from '@/common/errors';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'قائمة جميع التصنيفات',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories list - قائمة التصنيفات',
    schema: {
      example: [
        { id: 'uuid', nameAr: 'خضروات وفواكه', nameEn: 'Fruits & Vegetables', slug: 'fruits-vegetables', sortOrder: 1 },
        { id: 'uuid', nameAr: 'أرز وحبوب', nameEn: 'Rice & Grains', slug: 'rice-grains', sortOrder: 2 },
      ],
    },
  })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get('tree')
  @Public()
  @ApiOperation({
    summary: 'Get categories tree',
    description: 'شجرة التصنيفات مع الفروع',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories tree - شجرة التصنيفات',
    schema: {
      example: [
        {
          id: 'uuid',
          nameAr: 'خضروات وفواكه',
          children: [
            { id: 'uuid', nameAr: 'خضروات طازجة', children: [] },
            { id: 'uuid', nameAr: 'فواكه موسمية', children: [] },
          ],
        },
      ],
    },
  })
  async getTree() {
    return this.categoriesService.getTree();
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'تفاصيل تصنيف بالمعرّف',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found', type: ApiErrorResponse })
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({
    summary: 'Get category by slug',
    description: 'البحث عن تصنيف بالـ slug',
  })
  @ApiParam({ name: 'slug', description: 'Category slug', example: 'fruits-vegetables' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found', type: ApiErrorResponse })
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create category (Admin)',
    description: 'إنشاء تصنيف جديد - للمدير فقط',
  })
  @ApiResponse({ status: 201, description: 'Category created - تم إنشاء التصنيف' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ApiErrorResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponse })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update category (Admin)',
    description: 'تحديث تصنيف - للمدير فقط',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated - تم تحديث التصنيف' })
  @ApiResponse({ status: 404, description: 'Category not found', type: ApiErrorResponse })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete category (Admin)',
    description: 'حذف تصنيف - للمدير فقط',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category deleted - تم حذف التصنيف' })
  @ApiResponse({ status: 404, description: 'Category not found', type: ApiErrorResponse })
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
