import { OrderStatus, PaymentMethod, PaymentStatus } from '@hypermarket/shared-types';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { StructuredLogger, createLogger } from '@/common/observability';
import { PrismaService } from '@/prisma/prisma.service';

import { CreatePosOrderDto, PosOrderResponseDto, ProductLookupResponseDto } from './dto';

@Injectable()
export class PosService {
  private readonly logger: StructuredLogger;

  constructor(private readonly prisma: PrismaService) {
    this.logger = createLogger('PosService');
  }

  /**
   * Generate POS order number
   * Format: POS-YYYYMMDD-XXXXX (sequential within day)
   */
  private async generatePosOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `POS-${dateStr}-`;

    // Get count of POS orders today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await this.prisma.order.count({
      where: {
        orderType: 'POS',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(5, '0');
    return `${prefix}${sequence}`;
  }

  /**
   * Look up product by SKU or barcode
   * Returns product details for display in POS
   */
  async lookupProduct(sku: string): Promise<ProductLookupResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ sku: sku }, { sku: sku.toUpperCase() }],
        isActive: true,
        deletedAt: null,
      },
      include: {
        inventoryItems: {
          select: {
            quantity: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException({
        errorCode: 'pos.productNotFound',
        message: `Product not found: ${sku}`,
      });
    }

    // Calculate total available quantity across all locations
    const availableQuantity = product.inventoryItems.reduce(
      (sum: number, item: { quantity: number }) => sum + item.quantity,
      0,
    );

    return {
      id: product.id,
      sku: product.sku,
      nameAr: product.nameAr,
      salePriceIqd: product.salePrice,
      availableQuantity,
      inStock: availableQuantity > 0,
    };
  }

  /**
   * Create a POS order with instant payment and inventory deduction
   * This is a single transaction for speed and consistency
   */
  async createOrder(dto: CreatePosOrderDto, cashierId: string): Promise<PosOrderResponseDto> {
    const startTime = Date.now();

    // 1. Look up all products by SKU
    const skus = dto.items.map((item) => item.sku);
    const products = await this.prisma.product.findMany({
      where: {
        sku: { in: skus },
        isActive: true,
        deletedAt: null,
      },
      include: {
        inventoryItems: {
          select: {
            id: true,
            quantity: true,
            locationId: true,
          },
          orderBy: {
            quantity: 'desc', // Prefer locations with more stock
          },
        },
      },
    });

    // Map products by SKU for quick lookup
    type ProductWithInventory = (typeof products)[number];
    const productMap = new Map<string, ProductWithInventory>();
    for (const product of products) {
      productMap.set(product.sku, product);
    }

    // Validate all products exist
    for (const item of dto.items) {
      if (!productMap.has(item.sku)) {
        throw new BadRequestException({
          errorCode: 'pos.productNotFound',
          message: `Product not found: ${item.sku}`,
        });
      }
    }

    // 2. Calculate totals and validate stock
    const orderItems: Array<{
      productId: string;
      sku: string;
      nameAr: string;
      quantity: number;
      unitPriceIqd: number;
      totalIqd: number;
      inventoryDeductions: Array<{ inventoryItemId: string; quantity: number }>;
    }> = [];

    let subtotal = 0;

    for (const item of dto.items) {
      const product = productMap.get(item.sku)!;

      // Calculate available stock
      const availableStock = product.inventoryItems.reduce(
        (sum: number, inv: { quantity: number }) => sum + inv.quantity,
        0,
      );

      if (availableStock < item.quantity) {
        throw new BadRequestException({
          errorCode: 'pos.insufficientStock',
          message: `Insufficient stock for ${product.nameAr}. Available: ${availableStock}, Requested: ${item.quantity}`,
        });
      }

      // Determine inventory deductions (FIFO from locations with most stock)
      const deductions: Array<{ inventoryItemId: string; quantity: number }> = [];
      let remainingQty = item.quantity;

      for (const invItem of product.inventoryItems) {
        if (remainingQty <= 0) {
          break;
        }

        const deductQty = Math.min(invItem.quantity, remainingQty);
        if (deductQty > 0) {
          deductions.push({
            inventoryItemId: invItem.id,
            quantity: deductQty,
          });
          remainingQty -= deductQty;
        }
      }

      const lineTotal = product.salePrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: product.id,
        sku: product.sku,
        nameAr: product.nameAr,
        quantity: item.quantity,
        unitPriceIqd: product.salePrice,
        totalIqd: lineTotal,
        inventoryDeductions: deductions,
      });
    }

    // 3. Create order, payment, and deduct inventory in a single transaction
    const orderNumber = await this.generatePosOrderNumber();
    const total = subtotal; // No delivery fee for POS

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          orderType: 'POS',
          status: OrderStatus.COMPLETED,
          customerName: dto.customerName || null,
          customerPhone: dto.customerPhone || null,
          deliveryAddressText: null,
          totalAmountIqd: total,
          paymentMethod: PaymentMethod.CASH,
          cashierId,
          notes: dto.notes || null,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceIqd: item.unitPriceIqd,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Create payment as PAID immediately
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: PaymentMethod.CASH,
          status: PaymentStatus.PAID,
          amountIqd: total,
          paidAt: new Date(),
          paidBy: cashierId,
        },
      });

      // Deduct inventory for each item
      for (const item of orderItems) {
        for (const deduction of item.inventoryDeductions) {
          await tx.inventoryItem.update({
            where: { id: deduction.inventoryItemId },
            data: {
              quantity: {
                decrement: deduction.quantity,
              },
            },
          });
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorUserId: cashierId,
          entityType: 'Order',
          entityId: order.id,
          action: 'CREATE',
          metadata: {
            orderType: 'POS',
            orderNumber,
            total,
            itemCount: orderItems.length,
          },
        },
      });

      return order;
    });

    const duration = Date.now() - startTime;
    this.logger.log('POS order created', {
      orderNumber,
      total,
      itemCount: orderItems.length,
      durationMs: duration,
    });

    // Format response
    return {
      id: result.id,
      orderNumber: result.orderNumber,
      items: orderItems.map((item) => ({
        sku: item.sku,
        nameAr: item.nameAr,
        quantity: item.quantity,
        unitPriceIqd: item.unitPriceIqd,
        totalIqd: item.totalIqd,
      })),
      subtotalIqd: subtotal,
      totalIqd: total,
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.COMPLETED,
      cashierId,
      createdAt: result.createdAt,
    };
  }

  /**
   * Get POS order by order number (for receipt reprint)
   */
  async getOrderByNumber(orderNumber: string): Promise<PosOrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,
        orderType: 'POS',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                sku: true,
                nameAr: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException({
        errorCode: 'pos.orderNotFound',
        message: `Order not found: ${orderNumber}`,
      });
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      items: order.items.map(
        (item: {
          product: { sku: string; nameAr: string };
          quantity: number;
          unitPriceIqd: number;
        }) => ({
          sku: item.product.sku,
          nameAr: item.product.nameAr,
          quantity: item.quantity,
          unitPriceIqd: item.unitPriceIqd,
          totalIqd: item.quantity * item.unitPriceIqd,
        }),
      ),
      subtotalIqd: order.totalAmountIqd,
      totalIqd: order.totalAmountIqd,
      paymentStatus: order.payment?.status || 'UNKNOWN',
      orderStatus: order.status,
      cashierId: order.cashierId || '',
      createdAt: order.createdAt,
    };
  }

  /**
   * Get cashier's session statistics for today
   */
  async getSessionStats(cashierId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const [orders, totalResult, itemsResult] = await Promise.all([
      // Count orders
      this.prisma.order.count({
        where: {
          cashierId,
          orderType: 'POS',
          createdAt: { gte: startOfDay },
        },
      }),
      // Sum revenue
      this.prisma.order.aggregate({
        where: {
          cashierId,
          orderType: 'POS',
          createdAt: { gte: startOfDay },
        },
        _sum: { totalAmountIqd: true },
      }),
      // Count items sold
      this.prisma.orderItem.aggregate({
        where: {
          order: {
            cashierId,
            orderType: 'POS',
            createdAt: { gte: startOfDay },
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const revenue = totalResult._sum.totalAmountIqd || 0;
    const itemsSold = itemsResult._sum.quantity || 0;

    return {
      ordersToday: orders,
      revenueToday: revenue,
      averageOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
      itemsSoldToday: itemsSold,
    };
  }

  /**
   * Get recent POS orders for cashier
   */
  async getRecentOrders(cashierId: string, limit: number = 10) {
    const orders = await this.prisma.order.findMany({
      where: {
        cashierId,
        orderType: 'POS',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        totalAmountIqd: true,
        status: true,
        createdAt: true,
        _count: {
          select: { items: true },
        },
      },
    });

    return orders.map(
      (order: {
        id: string;
        orderNumber: string;
        totalAmountIqd: number;
        status: string;
        createdAt: Date;
        _count: { items: number };
      }) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalIqd: order.totalAmountIqd,
        status: order.status,
        itemCount: order._count.items,
        createdAt: order.createdAt,
      }),
    );
  }
}
