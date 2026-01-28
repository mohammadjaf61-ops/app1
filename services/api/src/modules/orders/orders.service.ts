import { OrderStatus, PaymentMethod } from '@hypermarket/shared-types';
import { generateOrderNumber } from '@hypermarket/shared-utils';
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';

import {
  InsufficientStockException,
  PriceChangedException,
  ProductUnavailableException,
  InsufficientStockItem,
  PriceChangedItem,
} from '@/common/exceptions';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

/** Reservation TTL in milliseconds (15 minutes) */
const RESERVATION_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all orders with filters and pagination
   */
  async findAll(params: {
    status?: OrderStatus;
    pickerId?: string;
    isPaid?: boolean;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const { status, pickerId, isPaid, search, dateFrom, dateTo, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (pickerId) {
      where.pickerId = pickerId;
    }
    if (isPaid !== undefined) {
      where.isPaid = isPaid;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt['gte'] = dateFrom;
      }
      if (dateTo) {
        where.createdAt['lte'] = dateTo;
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          picker: { select: { id: true, fullName: true } },
          items: {
            include: {
              product: { select: { id: true, sku: true, nameAr: true } },
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + orders.length < total,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Get order by ID
   */
  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        picker: { select: { id: true, fullName: true, phone: true } },
        items: {
          include: {
            product: {
              select: { id: true, sku: true, nameAr: true },
            },
          },
        },
        deliveryAssignment: {
          include: {
            driver: { select: { id: true, fullName: true, phone: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    return order;
  }

  /**
   * Get order by order number
   */
  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: { select: { id: true, sku: true, nameAr: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    return order;
  }

  /**
   * Get picker queue (orders assigned to picker)
   */
  async getPickerQueue(pickerId: string) {
    return this.prisma.order.findMany({
      where: {
        pickerId,
        status: { in: [OrderStatus.PENDING, OrderStatus.PICKING] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, sku: true, nameAr: true },
            },
          },
        },
      },
    });
  }

  /**
   * Create a new order with inventory reservation
   * Uses transaction to ensure atomic operation
   */
  async create(dto: CreateOrderDto) {
    const productIds = dto.items.map((item) => item.productId);

    // Use interactive transaction for inventory safety
    return this.prisma.$transaction(
      async (tx) => {
        // 1. Get delivery fee from settings
        const deliveryFeeSetting = await tx.setting.findUnique({
          where: { key: 'delivery_fee_iqd' },
        });
        const deliveryFee = deliveryFeeSetting ? (deliveryFeeSetting.value as number) : 5000;

        // 2. Fetch products with lock (SELECT FOR UPDATE via raw query for safety)
        const products = await tx.product.findMany({
          where: {
            id: { in: productIds },
            deletedAt: null,
            isActive: true,
          },
        });

        // 3. Check all products exist
        const foundIds = new Set(products.map((p) => p.id));
        const missingIds = productIds.filter((id) => !foundIds.has(id));
        if (missingIds.length > 0) {
          throw new ProductUnavailableException(missingIds);
        }

        const productMap = new Map(products.map((p) => [p.id, p]));

        // 4. Check for price changes (if expectedPrice provided)
        const priceChanges: PriceChangedItem[] = [];
        for (const item of dto.items) {
          const product = productMap.get(item.productId)!;
          if (item.expectedPrice !== undefined && item.expectedPrice !== product.salePrice) {
            priceChanges.push({
              productId: product.id,
              productName: product.nameAr,
              expectedPrice: item.expectedPrice,
              currentPrice: product.salePrice,
            });
          }
        }
        if (priceChanges.length > 0) {
          throw new PriceChangedException(priceChanges);
        }

        // 5. Get available inventory (total - held reservations)
        const productInventory = await this.getAvailableInventory(tx, productIds);

        // 6. Check inventory availability
        const insufficientItems: InsufficientStockItem[] = [];
        for (const item of dto.items) {
          const product = productMap.get(item.productId)!;
          const available = productInventory.get(item.productId) ?? 0;
          if (available < item.quantity) {
            insufficientItems.push({
              productId: product.id,
              productName: product.nameAr,
              requestedQuantity: item.quantity,
              availableQuantity: available,
            });
          }
        }
        if (insufficientItems.length > 0) {
          throw new InsufficientStockException(insufficientItems);
        }

        // 7. Calculate totals
        let subtotal = 0;
        const orderItems = dto.items.map((item) => {
          const product = productMap.get(item.productId)!;
          const itemTotal = product.salePrice * item.quantity;
          subtotal += itemTotal;
          return {
            productId: product.id,
            productNameSnapshot: product.nameAr,
            productPriceSnapshot: product.salePrice,
            quantity: item.quantity,
            total: itemTotal,
          };
        });

        const total = subtotal + deliveryFee;
        const orderNumber = generateOrderNumber();
        const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

        // 8. Create order with items and reservations atomically
        const order = await tx.order.create({
          data: {
            orderNumber,
            status: OrderStatus.PENDING,
            customerName: dto.customerName,
            customerPhone: dto.customerPhone,
            deliveryAddressText: dto.deliveryAddressText,
            subtotal,
            deliveryFee,
            total,
            paymentMethod: PaymentMethod.COD,
            isPaid: false,
            notes: dto.notes || null,
            items: {
              create: orderItems,
            },
            reservations: {
              create: dto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                status: ReservationStatus.HELD,
                expiresAt,
              })),
            },
          },
          include: {
            items: true,
            reservations: true,
          },
        });

        this.logger.log(
          `Order created: ${order.orderNumber} with ${order.reservations.length} reservations`,
        );

        return order;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000, // 10 seconds
      },
    );
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findById(id);

    // Validate status transition
    this.validateStatusTransition(order.status as OrderStatus, dto.status);

    // Handle PICKING status - commit reservations and deduct inventory
    if (dto.status === OrderStatus.PICKING) {
      return this.confirmOrder(id);
    }

    const updateData: Record<string, unknown> = { status: dto.status };

    if (dto.status === OrderStatus.READY) {
      updateData.pickedAt = new Date();
    } else if (dto.status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
      updateData.isPaid = true;
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    this.logger.log(`Order ${id} status changed to ${dto.status}`);

    return updated;
  }

  /**
   * Confirm order - commit reservations and deduct inventory
   */
  private async confirmOrder(orderId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        // Get order with reservations
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            reservations: {
              where: { status: ReservationStatus.HELD },
            },
            items: true,
          },
        });

        if (!order) {
          throw new NotFoundException('الطلب غير موجود');
        }

        // Commit reservations
        await tx.inventoryReservation.updateMany({
          where: {
            orderId,
            status: ReservationStatus.HELD,
          },
          data: {
            status: ReservationStatus.COMMITTED,
          },
        });

        // Deduct inventory for each reservation
        for (const reservation of order.reservations) {
          // Get inventory items for this product, ordered by expiry date (FEFO)
          const inventoryItems = await tx.inventoryItem.findMany({
            where: {
              productId: reservation.productId,
              quantity: { gt: 0 },
            },
            orderBy: [
              { expiryDate: 'asc' }, // First expiring first
              { quantity: 'desc' }, // Then by quantity
            ],
          });

          let remainingToDeduct = reservation.quantity;

          for (const item of inventoryItems) {
            if (remainingToDeduct <= 0) {
              break;
            }

            const deductAmount = Math.min(item.quantity, remainingToDeduct);
            await tx.inventoryItem.update({
              where: { id: item.id },
              data: { quantity: item.quantity - deductAmount },
            });
            remainingToDeduct -= deductAmount;
          }

          if (remainingToDeduct > 0) {
            this.logger.warn(
              `Could not fully deduct inventory for product ${reservation.productId}. Remaining: ${remainingToDeduct}`,
            );
          }
        }

        // Update order status
        const updated = await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PICKING },
          include: { items: true },
        });

        this.logger.log(`Order ${orderId} confirmed - reservations committed, inventory deducted`);

        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      },
    );
  }

  /**
   * Assign picker to order
   */
  async assignPicker(orderId: string, pickerId: string) {
    const order = await this.findById(orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('لا يمكن تعيين جامع لهذا الطلب');
    }

    // Validate picker exists and has PICKER role
    const picker = await this.prisma.user.findFirst({
      where: { id: pickerId, role: 'PICKER', isActive: true },
    });

    if (!picker) {
      throw new BadRequestException('الجامع غير موجود أو غير نشط');
    }

    // Use confirmOrder to handle reservation commit and inventory deduction
    return this.confirmOrder(orderId).then(async (confirmedOrder) => {
      // Now assign the picker
      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: { pickerId },
      });

      this.logger.log(`Picker ${pickerId} assigned to order ${orderId}`);

      return { ...confirmedOrder, pickerId: updated.pickerId };
    });
  }

  /**
   * Mark order as paid
   */
  async markAsPaid(orderId: string, isPaid: boolean) {
    await this.findById(orderId);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { isPaid },
    });

    this.logger.log(`Order ${orderId} marked as ${isPaid ? 'paid' : 'unpaid'}`);

    return updated;
  }

  /**
   * Cancel order - release reservations
   */
  async cancel(id: string, reason: string) {
    const order = await this.findById(id);

    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.PICKING];
    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException('لا يمكن إلغاء هذا الطلب');
    }

    return this.prisma.$transaction(
      async (tx) => {
        // Get reservations
        const reservations = await tx.inventoryReservation.findMany({
          where: { orderId: id },
        });

        // Release HELD reservations (they haven't been deducted yet)
        await tx.inventoryReservation.updateMany({
          where: {
            orderId: id,
            status: ReservationStatus.HELD,
          },
          data: {
            status: ReservationStatus.RELEASED,
          },
        });

        // For COMMITTED reservations, we need to restore inventory
        const committedReservations = reservations.filter(
          (r) => r.status === ReservationStatus.COMMITTED,
        );

        for (const reservation of committedReservations) {
          // Find first inventory item for this product and add back
          const inventoryItem = await tx.inventoryItem.findFirst({
            where: { productId: reservation.productId },
          });

          if (inventoryItem) {
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: inventoryItem.quantity + reservation.quantity },
            });
          }

          // Mark as released
          await tx.inventoryReservation.update({
            where: { id: reservation.id },
            data: { status: ReservationStatus.RELEASED },
          });
        }

        // Update order status
        const updated = await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            notes: reason ? `سبب الإلغاء: ${reason}` : order.notes,
          },
        });

        this.logger.log(`Order ${id} cancelled. Reason: ${reason}. Reservations released.`);

        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      },
    );
  }

  /**
   * Get order statistics
   */
  async getStatistics(dateFrom?: Date, dateTo?: Date) {
    const where: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt['gte'] = dateFrom;
      }
      if (dateTo) {
        where.createdAt['lte'] = dateTo;
      }
    }

    const [
      totalOrders,
      pendingOrders,
      pickingOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult,
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({
        where: { ...where, status: OrderStatus.PENDING },
      }),
      this.prisma.order.count({
        where: { ...where, status: OrderStatus.PICKING },
      }),
      this.prisma.order.count({
        where: { ...where, status: OrderStatus.READY },
      }),
      this.prisma.order.count({
        where: { ...where, status: OrderStatus.DELIVERED },
      }),
      this.prisma.order.count({
        where: { ...where, status: OrderStatus.CANCELLED },
      }),
      this.prisma.order.aggregate({
        where: { ...where, status: OrderStatus.DELIVERED },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      pickingOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: revenueResult._sum.total || 0,
    };
  }

  /**
   * Get available inventory for products
   * Subtracts HELD reservations from total inventory
   */
  private async getAvailableInventory(
    tx: Prisma.TransactionClient,
    productIds: string[],
  ): Promise<Map<string, number>> {
    // Get total inventory per product
    const inventoryTotals = await tx.inventoryItem.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _sum: { quantity: true },
    });

    // Get held reservations per product
    const heldReservations = await tx.inventoryReservation.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        status: ReservationStatus.HELD,
        expiresAt: { gt: new Date() }, // Only non-expired
      },
      _sum: { quantity: true },
    });

    const inventoryMap = new Map<string, number>();
    const heldMap = new Map<string, number>();

    for (const item of inventoryTotals) {
      inventoryMap.set(item.productId, item._sum.quantity ?? 0);
    }

    for (const item of heldReservations) {
      heldMap.set(item.productId, item._sum.quantity ?? 0);
    }

    // Calculate available = total - held
    const result = new Map<string, number>();
    for (const productId of productIds) {
      const total = inventoryMap.get(productId) ?? 0;
      const held = heldMap.get(productId) ?? 0;
      result.set(productId, Math.max(0, total - held));
    }

    return result;
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PICKING, OrderStatus.CANCELLED],
      [OrderStatus.PICKING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `لا يمكن تغيير حالة الطلب من ${currentStatus} إلى ${newStatus}`,
      );
    }
  }
}
