import { OrderStatus, PaymentMethod } from '@hypermarket/shared-types';
import { generateOrderNumber } from '@hypermarket/shared-utils';
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';

import { SettingsService, SETTINGS_KEYS } from '@/modules/settings';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

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

    const where: {
      status?: OrderStatus;
      pickerId?: string;
      isPaid?: boolean;
      OR?: Array<Record<string, unknown>>;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

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
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
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
              select: { id: true, sku: true, nameAr: true, imageUrl: true },
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
              include: {
                inventoryItems: {
                  include: { location: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create a new order
   */
  async create(dto: CreateOrderDto) {
    // Get delivery fee from settings (cached)
    const deliveryFee = await this.settingsService.getNumber(SETTINGS_KEYS.DELIVERY_FEE_IQD);

    // Get products and calculate totals
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('بعض المنتجات غير متوفرة');
    }

    type ProductType = (typeof products)[number];
    const productMap = new Map(products.map((p: ProductType) => [p.id, p]));

    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId) as
        | { id: string; nameAr: string; salePrice: number }
        | undefined;
      if (!product) {
        throw new BadRequestException(`المنتج غير موجود: ${item.productId}`);
      }

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

    // Create order
    const order = await this.prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
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
      },
      include: {
        items: true,
      },
    });

    this.logger.log(`Order created: ${order.orderNumber}`);

    return order;
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findById(id);

    // Validate status transition
    this.validateStatusTransition(order.status as OrderStatus, dto.status);

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

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        pickerId,
        status: OrderStatus.PICKING,
      },
    });

    this.logger.log(`Picker ${pickerId} assigned to order ${orderId}`);

    return updated;
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
   * Cancel order
   */
  async cancel(id: string, reason: string) {
    const order = await this.findById(id);

    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.PICKING];
    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException('لا يمكن إلغاء هذا الطلب');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        notes: reason ? `سبب الإلغاء: ${reason}` : order.notes,
      },
    });

    this.logger.log(`Order ${id} cancelled. Reason: ${reason}`);

    return updated;
  }

  /**
   * Get order statistics
   */
  async getStatistics(dateFrom?: Date, dateTo?: Date) {
    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
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
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PICKING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.READY } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
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
