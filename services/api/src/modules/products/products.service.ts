import { Injectable, NotFoundException } from '@nestjs/common';

import type { PaginationMeta } from '@hypermarket/shared-types';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('المنتج غير موجود');
    }

    return product;
  }

  async findBySku(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: { category: true },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('المنتج غير موجود');
    }

    return product;
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { barcode, deletedAt: null },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
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
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    // Soft delete
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
