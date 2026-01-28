import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    return category;
  }

  /**
   * Get all categories as a flat list
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
   */
  async getCategoryTree() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });

    // Build tree from flat list
    type CategoryType = (typeof categories)[number];
    const rootCategories = categories.filter((c: CategoryType) => !c.parentId);
    return rootCategories.map((root: CategoryType) => ({
      ...root,
      children: categories.filter((c: CategoryType) => c.parentId === root.id),
    }));
  }

  /**
   * Get category by ID
   */
  async findCategoryById(id: string) {
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

    const where: {
      deletedAt: null;
      categoryId?: string;
      isActive?: boolean;
      OR?: Array<Record<string, unknown>>;
      salePrice?: { gte?: number; lte?: number };
    } = {
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
        where.salePrice.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.salePrice.lte = maxPrice;
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

    return product;
  }

  /**
   * Find product by SKU
   */
  async findProductBySku(sku: string) {
    const product = await this.prisma.product.findFirst({
      where: { sku, deletedAt: null },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

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
    return {
      message: isActive ? 'تم تفعيل المنتج بنجاح' : 'تم تعطيل المنتج بنجاح',
    };
  }
}
