import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { OrderStatus, PaginationMeta, PaymentMethod, PaymentStatus } from '@hypermarket/shared-types';
import { generateOrderNumber } from '@hypermarket/shared-utils';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: OrderQueryDto) {
    const { page = 1, limit = 20, status, customerId, pickerId } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(pickerId && { pickerId }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, phoneNumber: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, nameAr: true, nameEn: true, sku: true },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    };

    return { data: orders, meta };
  }

  async findByCustomer(customerId: string, query: OrderQueryDto) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      customerId,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, nameAr: true, nameEn: true, sku: true },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    };

    return { data: orders, meta };
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phoneNumber: true },
        },
        items: {
          include: {
            product: true,
          },
        },
        picker: {
          select: { id: true, firstName: true, lastName: true },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phoneNumber: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    return order;
  }

  async getPickerQueue(pickerId: string) {
    return this.prisma.order.findMany({
      where: {
        pickerId,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.PICKING] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phoneNumber: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                sku: true,
                aisle: true,
                shelf: true,
                bin: true,
              },
            },
          },
        },
      },
    });
  }

  async create(customerId: string, dto: CreateOrderDto) {
    // Get customer address
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: dto.deliveryAddressId, customerId },
    });

    if (!address) {
      throw new BadRequestException('عنوان التوصيل غير موجود');
    }

    // Get products and calculate totals
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`المنتج غير موجود: ${item.productId}`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`الكمية غير متوفرة للمنتج: ${product.nameAr}`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal,
        productSnapshot: {
          sku: product.sku,
          name: product.nameAr,
          imageUrl: null, // Would come from product images
          location: {
            aisle: product.aisle,
            shelf: product.shelf,
            bin: product.bin,
          },
        },
      };
    });

    // TODO: Calculate delivery fee based on zone
    const deliveryFee = 5000; // Default delivery fee in IQD
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    // Create order
    const order = await this.prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId,
        status: OrderStatus.PENDING,
        subtotal,
        deliveryFee,
        discount,
        total,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        paymentStatus: PaymentStatus.PENDING,
        deliveryAddress: address.address as object,
        notes: dto.notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // Update product stock
    for (const item of dto.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findById(id);

    // Validate status transition
    this.validateStatusTransition(order.status as OrderStatus, dto.status);

    const updateData: Record<string, unknown> = { status: dto.status };

    if (dto.status === OrderStatus.PICKED) {
      updateData.pickedAt = new Date();
    } else if (dto.status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = PaymentStatus.PAID;
    } else if (dto.status === OrderStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = dto.notes;
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
      },
    });
  }

  async assignPicker(orderId: string, pickerId: string) {
    const order = await this.findById(orderId);

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('لا يمكن تعيين جامع لهذا الطلب');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        pickerId,
        status: OrderStatus.PICKING,
      },
    });
  }

  async cancel(id: string, reason: string, _userId: string) {
    const order = await this.findById(id);

    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException('لا يمكن إلغاء هذا الطلب');
    }

    // Restore stock
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PICKING, OrderStatus.CANCELLED],
      [OrderStatus.PICKING]: [OrderStatus.PICKED],
      [OrderStatus.PICKED]: [OrderStatus.READY_FOR_DELIVERY],
      [OrderStatus.READY_FOR_DELIVERY]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `لا يمكن تغيير حالة الطلب من ${currentStatus} إلى ${newStatus}`,
      );
    }
  }
}
