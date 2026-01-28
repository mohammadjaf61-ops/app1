import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateInventoryDto, AdjustInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== LOCATIONS ====================

  /**
   * Create a new inventory location
   */
  async createLocation(dto: CreateLocationDto) {
    // Check uniqueness
    const existing = await this.prisma.inventoryLocation.findFirst({
      where: {
        aisle: dto.aisle,
        shelf: dto.shelf,
        bin: dto.bin || null,
      },
    });

    if (existing) {
      throw new ConflictException('الموقع موجود مسبقاً');
    }

    const location = await this.prisma.inventoryLocation.create({
      data: {
        aisle: dto.aisle,
        shelf: dto.shelf,
        bin: dto.bin || null,
      },
    });

    this.logger.log(`Location created: ${location.id}`);
    return location;
  }

  /**
   * Get all locations
   */
  async findAllLocations() {
    return this.prisma.inventoryLocation.findMany({
      orderBy: [{ aisle: 'asc' }, { shelf: 'asc' }, { bin: 'asc' }],
      include: {
        _count: { select: { inventoryItems: true } },
      },
    });
  }

  /**
   * Get location by ID
   */
  async findLocationById(id: string) {
    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id },
      include: {
        inventoryItems: {
          include: { product: { select: { id: true, sku: true, nameAr: true } } },
        },
      },
    });

    if (!location) {
      throw new NotFoundException('الموقع غير موجود');
    }

    return location;
  }

  /**
   * Delete location
   */
  async deleteLocation(id: string) {
    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id },
      include: { _count: { select: { inventoryItems: true } } },
    });

    if (!location) {
      throw new NotFoundException('الموقع غير موجود');
    }

    if (location._count.inventoryItems > 0) {
      throw new ConflictException('لا يمكن حذف موقع يحتوي على مخزون');
    }

    await this.prisma.inventoryLocation.delete({ where: { id } });

    this.logger.log(`Location deleted: ${id}`);
    return { message: 'تم حذف الموقع بنجاح' };
  }

  // ==================== INVENTORY ====================

  /**
   * Set inventory for a product at a location
   */
  async setInventory(dto: UpdateInventoryDto) {
    // Validate product exists
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    // Validate location exists
    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id: dto.locationId },
    });
    if (!location) {
      throw new NotFoundException('الموقع غير موجود');
    }

    const inventory = await this.prisma.inventoryItem.upsert({
      where: {
        productId_locationId: {
          productId: dto.productId,
          locationId: dto.locationId,
        },
      },
      update: {
        quantity: dto.quantity,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
      create: {
        productId: dto.productId,
        locationId: dto.locationId,
        quantity: dto.quantity,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
      include: {
        product: { select: { id: true, sku: true, nameAr: true } },
        location: true,
      },
    });

    this.logger.log(
      `Inventory set: product=${dto.productId}, location=${dto.locationId}, qty=${dto.quantity}`,
    );

    return inventory;
  }

  /**
   * Adjust inventory quantity
   */
  async adjustInventory(dto: AdjustInventoryDto) {
    const existing = await this.prisma.inventoryItem.findUnique({
      where: {
        productId_locationId: {
          productId: dto.productId,
          locationId: dto.locationId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('سجل المخزون غير موجود');
    }

    const newQuantity = existing.quantity + dto.adjustment;

    if (newQuantity < 0) {
      throw new ConflictException('الكمية الناتجة لا يمكن أن تكون سالبة');
    }

    const inventory = await this.prisma.inventoryItem.update({
      where: {
        productId_locationId: {
          productId: dto.productId,
          locationId: dto.locationId,
        },
      },
      data: { quantity: newQuantity },
      include: {
        product: { select: { id: true, sku: true, nameAr: true } },
        location: true,
      },
    });

    this.logger.log(
      `Inventory adjusted: product=${dto.productId}, adjustment=${dto.adjustment}, reason=${dto.reason}`,
    );

    return inventory;
  }

  /**
   * Get inventory by product
   */
  async getInventoryByProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    const inventory = await this.prisma.inventoryItem.findMany({
      where: { productId },
      include: { location: true },
      orderBy: { location: { aisle: 'asc' } },
    });

    type InventoryItemType = (typeof inventory)[number];
    const totalQuantity = inventory.reduce(
      (sum: number, item: InventoryItemType) => sum + item.quantity,
      0,
    );

    return {
      product: {
        id: product.id,
        sku: product.sku,
        nameAr: product.nameAr,
      },
      totalQuantity,
      locations: inventory,
    };
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(threshold = 10) {
    return this.prisma.$queryRaw`
      SELECT
        p.id,
        p.sku,
        p.name_ar as "nameAr",
        COALESCE(SUM(i.quantity), 0)::int as "totalQuantity"
      FROM product p
      LEFT JOIN inventory_item i ON i.product_id = p.id
      WHERE p.deleted_at IS NULL AND p.is_active = true
      GROUP BY p.id, p.sku, p.name_ar
      HAVING COALESCE(SUM(i.quantity), 0) < ${threshold}
      ORDER BY COALESCE(SUM(i.quantity), 0) ASC
    `;
  }

  /**
   * Get items near expiry
   */
  async getNearExpiryItems(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.inventoryItem.findMany({
      where: {
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
        quantity: { gt: 0 },
      },
      include: {
        product: { select: { id: true, sku: true, nameAr: true } },
        location: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary() {
    const [totalProducts, totalLocations, lowStockCount, nearExpiryCount] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.inventoryLocation.count(),
      this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(DISTINCT p.id) as count
          FROM product p
          LEFT JOIN inventory_item i ON i.product_id = p.id
          WHERE p.deleted_at IS NULL AND p.is_active = true
          GROUP BY p.id
          HAVING COALESCE(SUM(i.quantity), 0) < 10
        `.then((r: unknown[]) => r.length),
      this.prisma.inventoryItem.count({
        where: {
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
          quantity: { gt: 0 },
        },
      }),
    ]);

    return {
      totalProducts,
      totalLocations,
      lowStockCount,
      nearExpiryCount,
    };
  }
}
