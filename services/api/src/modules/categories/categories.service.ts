import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CacheService, CACHE_KEYS, CACHE_TTL, createCacheKey } from '@/modules/cache';
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

export interface CategoryWithRelations {
  id: string;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  parent: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    slug: string;
  } | null;
  children: Array<{
    id: string;
    nameAr: string;
    nameEn: string | null;
    slug: string;
  }>;
}

export interface CategoryBase {
  id: string;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(): Promise<CategoryBase[]> {
    const cacheKey = CACHE_KEYS.CATEGORIES_LIST;

    // Try cache first
    const cached = await this.cacheService.get<CategoryBase[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });

    await this.cacheService.set(cacheKey, categories, CACHE_TTL.CATEGORIES_LIST);

    return categories;
  }

  async getTree(): Promise<CategoryTree[]> {
    const cacheKey = CACHE_KEYS.CATEGORIES_TREE;

    // Try cache first
    const cached = await this.cacheService.get<CategoryTree[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });

    // Build tree structure
    const map = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    for (const cat of categories) {
      map.set(cat.id, {
        id: cat.id,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        slug: cat.slug,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        children: [],
      });
    }

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

    await this.cacheService.set(cacheKey, roots, CACHE_TTL.CATEGORIES_TREE);

    return roots;
  }

  async findById(id: string): Promise<CategoryWithRelations> {
    const cacheKey = createCacheKey(CACHE_KEYS.CATEGORY_BY_ID, id);

    // Try cache first
    const cached = await this.cacheService.get<CategoryWithRelations>(cacheKey);
    if (cached) {
      if (cached.deletedAt) {
        await this.cacheService.del(cacheKey);
        throw new NotFoundException('التصنيف غير موجود');
      }
      return cached;
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
        children: {
          where: { deletedAt: null, isActive: true },
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    await this.cacheService.set(cacheKey, category, CACHE_TTL.CATEGORY_DETAIL);

    return category as CategoryWithRelations;
  }

  async findBySlug(slug: string): Promise<CategoryWithRelations> {
    const cacheKey = createCacheKey(CACHE_KEYS.CATEGORY_BY_SLUG, slug);

    // Try cache first
    const cached = await this.cacheService.get<CategoryWithRelations>(cacheKey);
    if (cached) {
      if (cached.deletedAt) {
        await this.cacheService.del(cacheKey);
        throw new NotFoundException('التصنيف غير موجود');
      }
      return cached;
    }

    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
        children: {
          where: { deletedAt: null, isActive: true },
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    await this.cacheService.set(cacheKey, category, CACHE_TTL.CATEGORY_DETAIL);

    return category as CategoryWithRelations;
  }

  async create(dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
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

    this.logger.log(`Category created: ${category.id}`);

    // Invalidate list and tree caches
    await this.invalidateListCaches();

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.findById(id);

    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Category updated: ${id}`);

    // Invalidate all related caches
    await Promise.all([
      this.invalidateListCaches(),
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATEGORY_BY_ID, id)),
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATEGORY_BY_SLUG, existing.slug)),
      // If slug changed, also invalidate new slug
      dto.slug && dto.slug !== existing.slug
        ? this.cacheService.del(createCacheKey(CACHE_KEYS.CATEGORY_BY_SLUG, dto.slug))
        : Promise.resolve(true),
    ]);

    return category;
  }

  async delete(id: string) {
    const existing = await this.findById(id);

    // Soft delete
    const category = await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Category deleted: ${id}`);

    // Invalidate all related caches
    await Promise.all([
      this.invalidateListCaches(),
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATEGORY_BY_ID, id)),
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATEGORY_BY_SLUG, existing.slug)),
    ]);

    return category;
  }

  /**
   * Invalidate list and tree caches
   * Called after any category mutation
   */
  private async invalidateListCaches(): Promise<void> {
    await Promise.all([
      this.cacheService.del(CACHE_KEYS.CATEGORIES_LIST),
      this.cacheService.del(CACHE_KEYS.CATEGORIES_TREE),
    ]);
  }
}
