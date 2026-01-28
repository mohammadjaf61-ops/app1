import type { PaginationMeta } from '@hypermarket/shared-types';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CacheService, CACHE_KEYS, CACHE_TTL, createCacheKey } from '@/modules/cache';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface ProductWithCategory {
  id: string;
  sku: string;
  barcode: string | null;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  categoryId: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  aisle: string | null;
  shelf: string | null;
  bin: string | null;
  weight: number | null;
  unit: string | null;
  unitValue: number | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  category: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    slug: string;
  };
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(query: ProductQueryDto) {
    const { page = 1, limit = 20, categoryId, search, inStock, isFeatured } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(categoryId && { categoryId }),
      ...(inStock !== undefined && { stockQuantity: inStock ? { gt: 0 } : { lte: 0 } }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(search && {
        OR: [
          { nameAr: { contains: search, mode: 'insensitive' as const } },
          { nameEn: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, nameAr: true, nameEn: true, slug: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    };

    return { data: products, meta };
  }

  async findById(id: string): Promise<ProductWithCategory> {
    const cacheKey = createCacheKey(CACHE_KEYS.PRODUCT_BY_ID, id);

    // Try cache first
    const cached = await this.cacheService.get<ProductWithCategory>(cacheKey);
    if (cached) {
      // Verify not soft-deleted (cache might be stale)
      if (cached.deletedAt) {
        await this.cacheService.del(cacheKey);
        throw new NotFoundException('المنتج غير موجود');
      }
      return cached;
    }

    // Cache miss - query database
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('المنتج غير موجود');
    }

    // Cache the result
    await this.cacheService.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);

    return product as ProductWithCategory;
  }

  async findBySku(sku: string): Promise<ProductWithCategory> {
    const cacheKey = createCacheKey(CACHE_KEYS.PRODUCT_BY_SKU, sku);

    // Try cache first
    const cached = await this.cacheService.get<ProductWithCategory>(cacheKey);
    if (cached) {
      if (cached.deletedAt) {
        await this.cacheService.del(cacheKey);
        throw new NotFoundException('المنتج غير موجود');
      }
      return cached;
    }

    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('المنتج غير موجود');
    }

    await this.cacheService.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);

    return product as ProductWithCategory;
  }

  async findByBarcode(barcode: string): Promise<ProductWithCategory> {
    // Barcode lookup - not cached as barcodes can be non-unique per business rules
    const product = await this.prisma.product.findFirst({
      where: { barcode, deletedAt: null },
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    return product as ProductWithCategory;
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        barcode: dto.barcode,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        categoryId: dto.categoryId,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        stockQuantity: dto.stockQuantity,
        lowStockThreshold: dto.lowStockThreshold ?? 10,
        aisle: dto.aisle,
        shelf: dto.shelf,
        bin: dto.bin,
        weight: dto.weight,
        unit: dto.unit,
        unitValue: dto.unitValue,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
      },
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
    });

    this.logger.log(`Product created: ${product.id} (${product.sku})`);

    // No cache to invalidate on create - lists are not cached due to dynamic filters

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.findById(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
    });

    this.logger.log(`Product updated: ${id}`);

    // Invalidate cache entries
    await Promise.all([
      this.cacheService.del(createCacheKey(CACHE_KEYS.PRODUCT_BY_ID, id)),
      this.cacheService.del(createCacheKey(CACHE_KEYS.PRODUCT_BY_SKU, existing.sku)),
      // If SKU changed, also invalidate the new SKU key
      dto.sku && dto.sku !== existing.sku
        ? this.cacheService.del(createCacheKey(CACHE_KEYS.PRODUCT_BY_SKU, dto.sku))
        : Promise.resolve(true),
    ]);

    return product;
  }

  async delete(id: string) {
    const existing = await this.findById(id);

    // Soft delete
    const product = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Product deleted: ${id}`);

    // Invalidate cache entries
    await Promise.all([
      this.cacheService.del(createCacheKey(CACHE_KEYS.PRODUCT_BY_ID, id)),
      this.cacheService.del(createCacheKey(CACHE_KEYS.PRODUCT_BY_SKU, existing.sku)),
    ]);

    return product;
  }
}
