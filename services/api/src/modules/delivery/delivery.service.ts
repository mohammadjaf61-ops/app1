import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { DeliveryStatus, OrderStatus } from '@hypermarket/shared-types';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all delivery assignments with filters
   */
  async findAll(params: {
    status?: DeliveryStatus;
    driverId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const { status, driverId, dateFrom, dateTo, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (driverId) where.driverId = driverId;

    if (dateFrom || dateTo) {
      where.assignedAt = {};
      if (dateFrom) where.assignedAt['gte'] = dateFrom;
      if (dateTo) where.assignedAt['lte'] = dateTo;
    }

    const [deliveries, total] = await Promise.all([
      this.prisma.deliveryAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assignedAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerPhone: true,
              deliveryAddressText: true,
              total: true,
            },
          },
          driver: {
            select: { id: true, fullName: true, phone: true },
          },
        },
      }),
      this.prisma.deliveryAssignment.count({ where }),
    ]);

    return {
      data: deliveries,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + deliveries.length < total,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Get delivery by ID
   */
  async findById(id: string) {
    const delivery = await this.prisma.deliveryAssignment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: { select: { id: true, sku: true, nameAr: true } },
              },
            },
          },
        },
        driver: {
          select: { id: true, fullName: true, phone: true },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('التوصيل غير موجود');
    }

    return delivery;
  }

  /**
   * Get driver's delivery queue
   */
  async getDriverQueue(driverId: string) {
    return this.prisma.deliveryAssignment.findMany({
      where: {
        driverId,
        status: {
          in: [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
          ],
        },
      },
      orderBy: { assignedAt: 'asc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            deliveryAddressText: true,
            total: true,
            notes: true,
          },
        },
      },
    });
  }

  /**
   * Assign delivery to driver
   */
  async assign(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('الطلب غير جاهز للتوصيل');
    }

    // Check if already assigned
    const existing = await this.prisma.deliveryAssignment.findUnique({
      where: { orderId },
    });

    if (existing) {
      throw new BadRequestException('الطلب مُعيّن للتوصيل مسبقاً');
    }

    // Validate driver
    const driver = await this.prisma.user.findFirst({
      where: { id: driverId, role: 'DRIVER', isActive: true },
    });

    if (!driver) {
      throw new BadRequestException('السائق غير موجود أو غير نشط');
    }

    // Create delivery assignment
    const delivery = await this.prisma.deliveryAssignment.create({
      data: {
        orderId,
        driverId,
        status: DeliveryStatus.ASSIGNED,
        assignedAt: new Date(),
      },
      include: {
        order: true,
        driver: { select: { id: true, fullName: true, phone: true } },
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.OUT_FOR_DELIVERY },
    });

    this.logger.log(`Delivery assigned: order=${orderId}, driver=${driverId}`);

    return delivery;
  }

  /**
   * Mark delivery as picked up from store
   */
  async pickup(id: string, driverId: string) {
    const delivery = await this.findById(id);

    if (delivery.driverId !== driverId) {
      throw new BadRequestException('ليس لديك صلاحية لهذا التوصيل');
    }

    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new BadRequestException('لا يمكن تحديث حالة التوصيل');
    }

    const updated = await this.prisma.deliveryAssignment.update({
      where: { id },
      data: {
        status: DeliveryStatus.PICKED_UP,
        pickedUpAt: new Date(),
      },
    });

    this.logger.log(`Delivery picked up: ${id}`);

    return updated;
  }

  /**
   * Start delivery (in transit)
   */
  async startDelivery(id: string, driverId: string) {
    const delivery = await this.findById(id);

    if (delivery.driverId !== driverId) {
      throw new BadRequestException('ليس لديك صلاحية لهذا التوصيل');
    }

    if (delivery.status !== DeliveryStatus.PICKED_UP) {
      throw new BadRequestException('لا يمكن بدء التوصيل');
    }

    const updated = await this.prisma.deliveryAssignment.update({
      where: { id },
      data: { status: DeliveryStatus.IN_TRANSIT },
    });

    this.logger.log(`Delivery in transit: ${id}`);

    return updated;
  }

  /**
   * Complete delivery
   */
  async complete(id: string, driverId: string, collectedAmount: number) {
    const delivery = await this.findById(id);

    if (delivery.driverId !== driverId) {
      throw new BadRequestException('ليس لديك صلاحية لهذا التوصيل');
    }

    if (delivery.status !== DeliveryStatus.IN_TRANSIT) {
      throw new BadRequestException('لا يمكن إتمام التوصيل');
    }

    // Update delivery
    const updated = await this.prisma.deliveryAssignment.update({
      where: { id },
      data: {
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
        collectedAmount,
      },
    });

    // Update order
    await this.prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
        isPaid: true,
      },
    });

    this.logger.log(`Delivery completed: ${id}, collected=${collectedAmount}`);

    return updated;
  }

  /**
   * Mark delivery as failed
   */
  async fail(id: string, driverId: string, reason: string) {
    const delivery = await this.findById(id);

    if (delivery.driverId !== driverId) {
      throw new BadRequestException('ليس لديك صلاحية لهذا التوصيل');
    }

    const failableStatuses = [
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
    ];

    if (!failableStatuses.includes(delivery.status as DeliveryStatus)) {
      throw new BadRequestException('لا يمكن تحديث حالة التوصيل');
    }

    const updated = await this.prisma.deliveryAssignment.update({
      where: { id },
      data: {
        status: DeliveryStatus.FAILED,
        failedAt: new Date(),
        failureReason: reason,
      },
    });

    this.logger.log(`Delivery failed: ${id}, reason=${reason}`);

    return updated;
  }

  /**
   * Get delivery statistics
   */
  async getStatistics(driverId?: string) {
    const where = driverId ? { driverId } : {};

    const [total, delivered, failed, inProgress, totalCollected] =
      await Promise.all([
        this.prisma.deliveryAssignment.count({ where }),
        this.prisma.deliveryAssignment.count({
          where: { ...where, status: DeliveryStatus.DELIVERED },
        }),
        this.prisma.deliveryAssignment.count({
          where: { ...where, status: DeliveryStatus.FAILED },
        }),
        this.prisma.deliveryAssignment.count({
          where: {
            ...where,
            status: {
              in: [
                DeliveryStatus.ASSIGNED,
                DeliveryStatus.PICKED_UP,
                DeliveryStatus.IN_TRANSIT,
              ],
            },
          },
        }),
        this.prisma.deliveryAssignment.aggregate({
          where: { ...where, status: DeliveryStatus.DELIVERED },
          _sum: { collectedAmount: true },
        }),
      ]);

    return {
      total,
      delivered,
      failed,
      inProgress,
      totalCollected: totalCollected._sum.collectedAmount || 0,
      successRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : 0,
    };
  }
}
