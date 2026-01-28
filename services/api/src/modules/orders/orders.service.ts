import { OrderStatus, PaymentMethod } from '@hypermarket/shared-types';
import { generateOrderNumber } from '@hypermarket/shared-utils';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bull';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ORDER_EVENTS_QUEUE, OrderEventJobs } from './queues/order-events.constants';
import type {
  OrderCancelledPayload,
  OrderCreatedPayload,
  OrderPickerAssignedPayload,
  OrderStatusChangedPayload,
} from './queues/order-events.types';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(ORDER_EVENTS_QUEUE)
    private readonly orderEventsQueue: Queue,
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
    // Get delivery fee from settings
    const deliveryFeeSetting = await this.prisma.setting.findUnique({
      where: { key: 'delivery_fee_iqd' },
    });
    const deliveryFee = deliveryFeeSetting ? parseInt(deliveryFeeSetting.value, 10) : 5000;

    // Get products and calculate totals
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('بعض المنتجات غير متوفرة');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
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

    // Emit ORDER_CREATED event asynchronously (does not block response)
    this.emitOrderCreated(order, dto.customerPhone).catch((err) => {
      this.logger.warn(`Failed to emit ORDER_CREATED event for ${order.orderNumber}:`, err);
    });

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

    // Emit ORDER_STATUS_CHANGED event asynchronously
    this.emitOrderStatusChanged(updated, order.status as OrderStatus, dto.status).catch((err) => {
      this.logger.warn(
        `Failed to emit ORDER_STATUS_CHANGED event for ${updated.orderNumber}:`,
        err,
      );
    });

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

    // Emit ORDER_PICKER_ASSIGNED event asynchronously
    this.emitOrderPickerAssigned(updated, pickerId, picker.fullName).catch((err) => {
      this.logger.warn(
        `Failed to emit ORDER_PICKER_ASSIGNED event for ${updated.orderNumber}:`,
        err,
      );
    });

    return updated;
  }

  /**
   * Mark order as paid
   */
  async markAsPaid(orderId: string, isPaid: boolean) {
    const order = await this.findById(orderId);

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

    // Emit ORDER_CANCELLED event asynchronously
    this.emitOrderCancelled(updated, reason).catch((err) => {
      this.logger.warn(`Failed to emit ORDER_CANCELLED event for ${updated.orderNumber}:`, err);
    });

    return updated;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Event Emitters - Async jobs that don't block the main request flow
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Emit ORDER_CREATED event to queue
   */
  private async emitOrderCreated(
    order: { id: string; orderNumber: string; items: unknown[] } & Record<string, unknown>,
    customerPhone: string,
  ): Promise<void> {
    const payload: OrderCreatedPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerPhone,
      totalAmountIqd: (order.total as number) || 0,
      itemCount: order.items?.length || 0,
      timestamp: new Date().toISOString(),
    };

    await this.orderEventsQueue.add(OrderEventJobs.ORDER_CREATED, payload, {
      jobId: `order-created-${order.id}`,
    });

    this.logger.debug(`ORDER_CREATED job queued for ${order.orderNumber}`);
  }

  /**
   * Emit ORDER_STATUS_CHANGED event to queue
   */
  private async emitOrderStatusChanged(
    order: { id: string; orderNumber: string } & Record<string, unknown>,
    previousStatus: OrderStatus,
    newStatus: OrderStatus,
    actorId?: string,
  ): Promise<void> {
    const payload: OrderStatusChangedPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus,
      actorId,
      timestamp: new Date().toISOString(),
    };

    await this.orderEventsQueue.add(OrderEventJobs.ORDER_STATUS_CHANGED, payload, {
      jobId: `order-status-${order.id}-${Date.now()}`,
    });

    this.logger.debug(`ORDER_STATUS_CHANGED job queued for ${order.orderNumber}`);
  }

  /**
   * Emit ORDER_PICKER_ASSIGNED event to queue
   */
  private async emitOrderPickerAssigned(
    order: { id: string; orderNumber: string } & Record<string, unknown>,
    pickerId: string,
    pickerName: string,
  ): Promise<void> {
    const payload: OrderPickerAssignedPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      pickerId,
      pickerName,
      timestamp: new Date().toISOString(),
    };

    await this.orderEventsQueue.add(OrderEventJobs.ORDER_PICKER_ASSIGNED, payload, {
      jobId: `order-picker-${order.id}-${pickerId}`,
    });

    this.logger.debug(`ORDER_PICKER_ASSIGNED job queued for ${order.orderNumber}`);
  }

  /**
   * Emit ORDER_CANCELLED event to queue
   */
  private async emitOrderCancelled(
    order: { id: string; orderNumber: string } & Record<string, unknown>,
    reason: string,
    cancelledBy?: string,
  ): Promise<void> {
    const payload: OrderCancelledPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason,
      cancelledBy,
      timestamp: new Date().toISOString(),
    };

    await this.orderEventsQueue.add(OrderEventJobs.ORDER_CANCELLED, payload, {
      jobId: `order-cancelled-${order.id}`,
    });

    this.logger.debug(`ORDER_CANCELLED job queued for ${order.orderNumber}`);
  }
}
