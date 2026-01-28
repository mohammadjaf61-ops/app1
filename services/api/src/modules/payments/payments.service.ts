import { PaymentMethod, PaymentStatus } from '@hypermarket/shared-types';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { StructuredLogger, createLogger } from '@/common/observability';
import { PrismaService } from '@/prisma/prisma.service';

import {
  PAYMENT_PROVIDER,
  PaymentProviderAdapter,
  InitiatePaymentRequest,
} from './payment-provider.interface';

export interface CreatePaymentParams {
  orderId: string;
  method: PaymentMethod;
  amountIqd: number;
  customerPhone?: string;
}

export interface PaymentResult {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountIqd: number;
  providerRef: string | null;
  redirectUrl?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger: StructuredLogger;

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider?: PaymentProviderAdapter,
  ) {
    this.logger = createLogger('PaymentsService');
  }

  /**
   * Create a payment for an order
   * For COD: Creates payment with PENDING status
   * For CARD: Initiates payment with provider (when available)
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const { orderId, method, amountIqd, customerPhone } = params;

    // Check if payment already exists for this order
    const existing = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (existing) {
      throw new BadRequestException({
        errorCode: 'payments.alreadyExists',
        message: 'Payment already exists for this order',
      });
    }

    // For COD, simply create a PENDING payment
    if (method === PaymentMethod.COD) {
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          method,
          status: PaymentStatus.PENDING,
          amountIqd,
        },
      });

      this.logger.log('COD payment created', { orderId, paymentId: payment.id });

      return {
        id: payment.id,
        orderId: payment.orderId,
        method: payment.method as PaymentMethod,
        status: payment.status as PaymentStatus,
        amountIqd: payment.amountIqd,
        providerRef: null,
      };
    }

    // For CARD payments, initiate with provider
    if (method === PaymentMethod.CARD) {
      if (!this.paymentProvider) {
        throw new BadRequestException({
          errorCode: 'payments.cardNotAvailable',
          message: 'Card payments are not yet available. Please use Cash on Delivery.',
        });
      }

      const initiateRequest: InitiatePaymentRequest = {
        orderId,
        amountIqd,
        customerPhone: customerPhone || '',
        description: `Order payment: ${orderId}`,
      };

      const providerResponse = await this.paymentProvider.initiatePayment(initiateRequest);

      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          method,
          status: PaymentStatus.PENDING,
          amountIqd,
          providerRef: providerResponse.providerRef,
          providerName: this.paymentProvider.name,
        },
      });

      this.logger.log('Card payment initiated', {
        orderId,
        paymentId: payment.id,
        provider: this.paymentProvider.name,
      });

      return {
        id: payment.id,
        orderId: payment.orderId,
        method: payment.method as PaymentMethod,
        status: payment.status as PaymentStatus,
        amountIqd: payment.amountIqd,
        providerRef: providerResponse.providerRef,
        redirectUrl: providerResponse.redirectUrl,
      };
    }

    throw new BadRequestException({
      errorCode: 'payments.invalidMethod',
      message: 'Invalid payment method',
    });
  }

  /**
   * Get payment by ID
   */
  async getById(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            totalAmountIqd: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException({
        errorCode: 'payments.notFound',
        message: 'Payment not found',
      });
    }

    return payment;
  }

  /**
   * Get payment by order ID
   */
  async getByOrderId(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      throw new NotFoundException({
        errorCode: 'payments.notFoundForOrder',
        message: 'Payment not found for this order',
      });
    }

    return payment;
  }

  /**
   * Mark payment as paid (manual COD collection)
   */
  async markPaid(paymentId: string, paidBy: string): Promise<void> {
    const payment = await this.getById(paymentId);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException({
        errorCode: 'payments.alreadyPaid',
        message: 'Payment is already marked as paid',
      });
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException({
        errorCode: 'payments.alreadyRefunded',
        message: 'Cannot mark refunded payment as paid',
      });
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          paidBy,
        },
      }),
      // Also update order isPaid flag
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { isPaid: true },
      }),
      // Create audit log
      this.prisma.auditLog.create({
        data: {
          actorUserId: paidBy,
          entityType: 'Payment',
          entityId: paymentId,
          action: 'PAYMENT_STATUS_CHANGE',
          metadata: {
            previousStatus: payment.status,
            newStatus: PaymentStatus.PAID,
            orderId: payment.orderId,
          },
        },
      }),
    ]);

    this.logger.log('Payment marked as paid', { paymentId, paidBy, orderId: payment.orderId });
  }

  /**
   * Mark payment as failed
   */
  async markFailed(paymentId: string, reason: string, actorId?: string): Promise<void> {
    const payment = await this.getById(paymentId);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException({
        errorCode: 'payments.cannotMarkFailed',
        message: 'Only pending payments can be marked as failed',
      });
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: reason,
        },
      }),
      // Create audit log
      this.prisma.auditLog.create({
        data: {
          actorUserId: actorId || null,
          entityType: 'Payment',
          entityId: paymentId,
          action: 'PAYMENT_STATUS_CHANGE',
          metadata: {
            previousStatus: payment.status,
            newStatus: PaymentStatus.FAILED,
            reason,
            orderId: payment.orderId,
          },
        },
      }),
    ]);

    this.logger.log('Payment marked as failed', { paymentId, reason, orderId: payment.orderId });
  }

  /**
   * Get all payments with filters
   */
  async findAll(params: {
    status?: PaymentStatus;
    method?: PaymentMethod;
    orderId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, method, orderId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: {
      status?: PaymentStatus;
      method?: PaymentMethod;
      orderId?: string;
    } = {};

    if (status) {
      where.status = status;
    }
    if (method) {
      where.method = method;
    }
    if (orderId) {
      where.orderId = orderId;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerPhone: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + payments.length < total,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Get payment statistics
   */
  async getStatistics() {
    const [
      totalPayments,
      pendingPayments,
      paidPayments,
      failedPayments,
      paidAmountResult,
      pendingAmountResult,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { amountIqd: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PENDING },
        _sum: { amountIqd: true },
      }),
    ]);

    return {
      totalPayments,
      pendingPayments,
      paidPayments,
      failedPayments,
      totalPaidAmountIqd: paidAmountResult._sum.amountIqd || 0,
      totalPendingAmountIqd: pendingAmountResult._sum.amountIqd || 0,
    };
  }
}
