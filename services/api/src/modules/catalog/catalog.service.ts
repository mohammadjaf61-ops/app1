import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';

import { CacheService, CACHE_KEYS, CACHE_TTL, createCacheKey } from '@/modules/cache';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface CatalogCategoryTree {
  id: string;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children: CatalogCategoryTree[];
}

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  // ==================== CATEGORIES ====================

  /**
   * Create a new category
   */
  async createCategory(dto: CreateCategoryDto) {
    // Validate parent exists if provided
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('الفئة الأب غير موجودة');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        nameAr: dto.nameAr,
        parentId: dto.parentId || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Category created: ${category.id}`);

    // Invalidate category caches
    await this.invalidateCategoryCaches();

    return category;
  }

  /**
   * Get all categories as a flat list
   * Not cached due to dynamic filters (isActive, parentId)
   */
  async findAllCategories(params: { isActive?: boolean; parentId?: string }) {
    const { isActive, parentId } = params;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    return this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });
  }

  /**
   * Get categories as a tree structure
   * Cached as this is frequently accessed by mobile apps
   */
  async getCategoryTree(): Promise<CatalogCategoryTree[]> {
    const cacheKey = CACHE_KEYS.CATALOG_CATEGORY_TREE;

    // Try cache first
    const cached = await this.cacheService.get<CatalogCategoryTree[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });

    // Build tree from flat list
    const categoryMap = new Map<string, CatalogCategoryTree>();

    for (const cat of categories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        slug: cat.slug,
        imageUrl: cat.imageUrl,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        children: [],
      });
    }

    const roots: CatalogCategoryTree[] = [];

    categoryMap.forEach((cat) => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
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

  /**
   * Get category by ID
   */
  async findCategoryById(id: string) {
    const cacheKey = createCacheKey(CACHE_KEYS.CATALOG_CATEGORIES, id);

    // Try cache first
    const cached = await this.cacheService.get<{
      id: string;
      nameAr: string;
      children: unknown[];
      _count: { products: number };
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('الفئة غير موجودة');
    }

    await this.cacheService.set(cacheKey, category, CACHE_TTL.CATEGORY_DETAIL);

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('الفئة غير موجودة');
    }

    // Validate parent if changing
    if (dto.parentId && dto.parentId !== existing.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException('لا يمكن تعيين الفئة كفئة أب لنفسها');
      }
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('الفئة الأب غير موجودة');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.nameAr && { nameAr: dto.nameAr }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Category updated: ${id}`);

    // Invalidate caches
    await Promise.all([
      this.invalidateCategoryCaches(),
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATALOG_CATEGORIES, id)),
    ]);

    return category;
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!category) {
      throw new NotFoundException('الفئة غير موجودة');
    }

    if (category._count.products > 0) {
      throw new ConflictException('لا يمكن حذف فئة تحتوي على منتجات');
    }

    if (category._count.children > 0) {
      throw new ConflictException('لا يمكن حذف فئة تحتوي على فئات فرعية');
    }

    await this.prisma.category.delete({ where: { id } });

    this.logger.log(`Category deleted: ${id}`);

    // Invalidate caches
    await Promise.all([
      this.invalidateCategoryCaches(),
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATALOG_CATEGORIES, id)),
    ]);

    return { message: 'تم حذف الفئة بنجاح' };
  }

  // ==================== PRODUCTS ====================

  /**
   * Create a new product
   */
  async createProduct(dto: CreateProductDto) {
    // Check SKU uniqueness
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException('رمز المنتج موجود مسبقاً');
    }

    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('الفئة غير موجودة');
    }

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        barcode: dto.barcode || null,
        nameAr: dto.nameAr,
        descriptionAr: dto.descriptionAr || null,
        imageUrl: dto.imageUrl || null,
        categoryId: dto.categoryId,
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        isActive: dto.isActive ?? true,
      },
      include: { category: true },
    });

    this.logger.log(`Product created: ${product.id} (${product.sku})`);
    return product;
  }

  /**
   * Find all products with filters and pagination
   * Not cached due to dynamic filters and pagination
   */
  async findAllProducts(params: {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const { categoryId, isActive, search, minPrice, maxPrice, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null, // Only non-deleted products
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.salePrice = {};
      if (minPrice !== undefined) {
        (where.salePrice as Record<string, number>)['gte'] = minPrice;
      }
      if (maxPrice !== undefined) {
        (where.salePrice as Record<string, number>)['lte'] = maxPrice;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: { select: { id: true, nameAr: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + products.length < total,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Find product by ID
   */
  async findProductById(id: string) {
    const cacheKey = createCacheKey(CACHE_KEYS.CATALOG_PRODUCTS, id);

    // Try cache first
    const cached = await this.cacheService.get<{
      id: string;
      sku: string;
      deletedAt: Date | null;
    }>(cacheKey);
    if (cached) {
      if (cached.deletedAt) {
        await this.cacheService.del(cacheKey);
        throw new NotFoundException('المنتج غير موجود');
      }
      return cached;
    }

    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        inventoryItems: {
          include: { location: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    await this.cacheService.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);

    return product;
  }

  /**
   * Find product by SKU
   */
  async findProductBySku(sku: string) {
    const cacheKey = createCacheKey(CACHE_KEYS.CATALOG_PRODUCTS, 'sku', sku);

    // Try cache first
    const cached = await this.cacheService.get<{
      id: string;
      sku: string;
      deletedAt: Date | null;
    }>(cacheKey);
    if (cached) {
      if (cached.deletedAt) {
        await this.cacheService.del(cacheKey);
        throw new NotFoundException('المنتج غير موجود');
      }
      return cached;
    }

    const product = await this.prisma.product.findFirst({
      where: { sku, deletedAt: null },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    await this.cacheService.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('المنتج غير موجود');
    }

    // Check SKU uniqueness if changing
    if (dto.sku && dto.sku !== existing.sku) {
      const skuExists = await this.prisma.product.findFirst({
        where: { sku: dto.sku, id: { not: id } },
      });
      if (skuExists) {
        throw new ConflictException('رمز المنتج موجود مسبقاً');
      }
    }

    // Validate category if changing
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('الفئة غير موجودة');
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.sku && { sku: dto.sku }),
        ...(dto.barcode !== undefined && { barcode: dto.barcode }),
        ...(dto.nameAr && { nameAr: dto.nameAr }),
        ...(dto.descriptionAr !== undefined && {
          descriptionAr: dto.descriptionAr,
        }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
        ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { category: true },
    });

    this.logger.log(`Product updated: ${id}`);

    // Invalidate product caches
    await Promise.all([
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATALOG_PRODUCTS, id)),
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATALOG_PRODUCTS, 'sku', existing.sku)),
      dto.sku && dto.sku !== existing.sku
        ? this.cacheService.del(createCacheKey(CACHE_KEYS.CATALOG_PRODUCTS, 'sku', dto.sku))
        : Promise.resolve(true),
    ]);

    return product;
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`Product soft-deleted: ${id}`);

    // Invalidate product caches
    await Promise.all([
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATALOG_PRODUCTS, id)),
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATALOG_PRODUCTS, 'sku', product.sku)),
    ]);

    return { message: 'تم حذف المنتج بنجاح' };
  }

  /**
   * Activate/deactivate product
   */
  async toggleProductActive(id: string, isActive: boolean) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive },
    });

    this.logger.log(`Product ${isActive ? 'activated' : 'deactivated'}: ${id}`);

    // Invalidate product caches
    await Promise.all([
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATALOG_PRODUCTS, id)),
      this.cacheService.del(createCacheKey(CACHE_KEYS.CATALOG_PRODUCTS, 'sku', product.sku)),
    ]);

    return {
      message: isActive ? 'تم تفعيل المنتج بنجاح' : 'تم تعطيل المنتج بنجاح',
    };
  }

  /**
   * Invalidate all category-related caches
   */
  private async invalidateCategoryCaches(): Promise<void> {
    await Promise.all([
      this.cacheService.del(CACHE_KEYS.CATALOG_CATEGORY_TREE),
      this.cacheService.del(CACHE_KEYS.CATEGORIES_LIST),
      this.cacheService.del(CACHE_KEYS.CATEGORIES_TREE),
    ]);
  }
}
