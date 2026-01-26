import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import {
  DeliveryStatus,
  OrderStatus,
  PaymentStatus,
  PaginationMeta,
} from '@hypermarket/shared-types';

import { PrismaService } from '@/prisma/prisma.service';

import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { FailDeliveryDto } from './dto/fail-delivery.dto';
import { DeliveryQueryDto } from './dto/delivery-query.dto';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: DeliveryQueryDto) {
    const { page = 1, limit = 20, status, driverId } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(driverId && { driverId }),
    };

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              items: { select: { quantity: true } },
            },
          },
          driver: {
            select: { id: true, firstName: true, lastName: true, phoneNumber: true },
          },
        },
      }),
      this.prisma.delivery.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    };

    return { data: deliveries, meta };
  }

  async findById(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: {
              select: { id: true, firstName: true, lastName: true, phoneNumber: true },
            },
            items: {
              include: { product: true },
            },
          },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phoneNumber: true },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('التوصيل غير موجود');
    }

    return delivery;
  }

  async getDriverQueue(driverId: string) {
    return this.prisma.delivery.findMany({
      where: {
        driverId,
        status: {
          in: [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
            DeliveryStatus.ARRIVED,
          ],
        },
      },
      orderBy: { assignedAt: 'asc' },
      include: {
        order: {
          include: {
            customer: {
              select: { id: true, firstName: true, lastName: true, phoneNumber: true },
            },
            items: { select: { quantity: true } },
          },
        },
      },
    });
  }

  async assign(dto: AssignDeliveryDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phoneNumber: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (order.status !== OrderStatus.READY_FOR_DELIVERY) {
      throw new BadRequestException('الطلب غير جاهز للتوصيل');
    }

    // Create delivery record
    const delivery = await this.prisma.delivery.create({
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        driverId: dto.driverId,
        status: DeliveryStatus.ASSIGNED,
        deliveryAddress: order.deliveryAddress as object,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerPhone: order.customer.phoneNumber,
        itemCount: await this.prisma.orderItem.count({ where: { orderId: order.id } }),
        totalAmount: order.total,
        assignedAt: new Date(),
        deliveryNotes: dto.notes,
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.OUT_FOR_DELIVERY,
        driverId: dto.driverId,
      },
    });

    return delivery;
  }

  async pickup(id: string) {
    const delivery = await this.findById(id);

    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new BadRequestException('لا يمكن تحديث حالة التوصيل');
    }

    return this.prisma.delivery.update({
      where: { id },
      data: {
        status: DeliveryStatus.PICKED_UP,
        pickedUpAt: new Date(),
      },
    });
  }

  async startDelivery(id: string) {
    const delivery = await this.findById(id);

    if (delivery.status !== DeliveryStatus.PICKED_UP) {
      throw new BadRequestException('لا يمكن بدء التوصيل');
    }

    return this.prisma.delivery.update({
      where: { id },
      data: { status: DeliveryStatus.IN_TRANSIT },
    });
  }

  async arrive(id: string) {
    const delivery = await this.findById(id);

    if (delivery.status !== DeliveryStatus.IN_TRANSIT) {
      throw new BadRequestException('لا يمكن تحديث حالة الوصول');
    }

    return this.prisma.delivery.update({
      where: { id },
      data: { status: DeliveryStatus.ARRIVED },
    });
  }

  async complete(id: string, dto: CompleteDeliveryDto) {
    const delivery = await this.findById(id);

    if (delivery.status !== DeliveryStatus.ARRIVED) {
      throw new BadRequestException('لا يمكن إتمام التوصيل');
    }

    // Update delivery
    const updatedDelivery = await this.prisma.delivery.update({
      where: { id },
      data: {
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
        collectedAmount: dto.collectedAmount,
        customerSignature: dto.signature,
        deliveryNotes: dto.notes,
      },
    });

    // Update order
    await this.prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
        paymentStatus: PaymentStatus.PAID,
      },
    });

    return updatedDelivery;
  }

  async fail(id: string, dto: FailDeliveryDto) {
    const delivery = await this.findById(id);

    const failableStatuses = [
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.ARRIVED,
    ];

    if (!failableStatuses.includes(delivery.status as DeliveryStatus)) {
      throw new BadRequestException('لا يمكن تحديث حالة التوصيل');
    }

    return this.prisma.delivery.update({
      where: { id },
      data: {
        status: DeliveryStatus.FAILED,
        failedAt: new Date(),
        failureReason: dto.reason,
        failureNotes: dto.notes,
      },
    });
  }
}
