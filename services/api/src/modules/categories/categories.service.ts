import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryTree {
  id: string;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  children: CategoryTree[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });
  }

  async getTree(): Promise<CategoryTree[]> {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });

    // Build tree structure
    const map = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    type CategoryRecord = (typeof categories)[number];
    categories.forEach((cat: CategoryRecord) => {
      map.set(cat.id, {
        id: cat.id,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        slug: cat.slug,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        children: [],
      });
    });

    map.forEach((cat) => {
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        if (parent) {
          parent.children.push(cat);
        }
      } else {
        roots.push(cat);
      }
    });

    return roots;
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null, isActive: true },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null, isActive: true },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        slug: dto.slug,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    // Soft delete
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
