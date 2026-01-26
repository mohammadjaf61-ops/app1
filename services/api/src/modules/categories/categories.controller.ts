import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { UserRole } from '@hypermarket/shared-types';

import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get('tree')
  @Public()
  @ApiOperation({ summary: 'Get categories as tree structure' })
  async getTree() {
    return this.categoriesService.getTree();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by ID' })
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get category by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (admin only)' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
