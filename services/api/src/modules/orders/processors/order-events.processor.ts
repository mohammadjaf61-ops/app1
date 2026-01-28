import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { Job } from 'bull';

import { PrismaService } from '@/prisma/prisma.service';

import { ORDER_EVENTS_QUEUE, OrderEventJobs } from '../queues/order-events.constants';
import type {
  OrderCancelledPayload,
  OrderCreatedPayload,
  OrderPickerAssignedPayload,
  OrderStatusChangedPayload,
} from '../queues/order-events.types';

/**
 * Processor for order-related events.
 *
 * Handles async tasks that don't need to block the main order flow:
 * - Audit logging
 * - Analytics counters (placeholder)
 * - Notifications (placeholder - just logs for now)
 *
 * Jobs are idempotent and safe to retry.
 */
@Processor(ORDER_EVENTS_QUEUE)
export class OrderEventsProcessor {
  private readonly logger = new Logger(OrderEventsProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle ORDER_CREATED event
   * - Create audit log entry
   * - Log notification placeholder
   * - Update analytics counters (placeholder)
   */
  @Process(OrderEventJobs.ORDER_CREATED)
  async handleOrderCreated(job: Job<OrderCreatedPayload>): Promise<void> {
    const { orderId, orderNumber, customerPhone, totalAmountIqd, itemCount } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing ORDER_CREATED: ${orderNumber} (jobId: ${job.id})`);

    try {
      // 1. Audit Log - record order creation
      await this.createAuditLog({
        entityType: 'Order',
        entityId: orderId,
        action: AuditAction.CREATE,
        metadata: {
          orderNumber,
          totalAmountIqd,
          itemCount,
          source: 'order-events-processor',
        },
      });

      // 2. Notification Placeholder
      // In production: send SMS/Push notification to customer
      this.logger.log(
        `[NOTIFICATION PLACEHOLDER] Order ${orderNumber} created. Would notify customer at ${customerPhone}`,
      );

      // 3. Analytics Placeholder
      // In production: increment daily order counters
      this.logger.debug('[ANALYTICS PLACEHOLDER] Would increment order_created counter');

      const duration = Date.now() - startTime;
      this.logger.log(`ORDER_CREATED processed successfully: ${orderNumber} (${duration}ms)`);
    } catch (error) {
      this.logger.error(
        `Failed to process ORDER_CREATED for ${orderNumber}:`,
        error instanceof Error ? error.message : error,
      );
      throw error; // Allow BullMQ to retry
    }
  }

  /**
   * Handle ORDER_STATUS_CHANGED event
   * - Create audit log entry
   * - Trigger status-specific actions
   */
  @Process(OrderEventJobs.ORDER_STATUS_CHANGED)
  async handleOrderStatusChanged(job: Job<OrderStatusChangedPayload>): Promise<void> {
    const { orderId, orderNumber, previousStatus, newStatus, actorId } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `Processing ORDER_STATUS_CHANGED: ${orderNumber} (${previousStatus} -> ${newStatus}, jobId: ${job.id})`,
    );

    try {
      // 1. Audit Log - record status change
      await this.createAuditLog({
        actorUserId: actorId,
        entityType: 'Order',
        entityId: orderId,
        action: AuditAction.STATUS_CHANGE,
        metadata: {
          orderNumber,
          previousStatus,
          newStatus,
          source: 'order-events-processor',
        },
      });

      // 2. Status-specific notifications (placeholder)
      this.logStatusNotification(orderNumber, newStatus);

      // 3. Analytics Placeholder
      this.logger.debug(
        `[ANALYTICS PLACEHOLDER] Would update status_change counters: ${previousStatus} -> ${newStatus}`,
      );

      const duration = Date.now() - startTime;
      this.logger.log(`ORDER_STATUS_CHANGED processed: ${orderNumber} (${duration}ms)`);
    } catch (error) {
      this.logger.error(
        `Failed to process ORDER_STATUS_CHANGED for ${orderNumber}:`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Handle ORDER_PICKER_ASSIGNED event
   * - Create audit log entry
   * - Notify picker (placeholder)
   */
  @Process(OrderEventJobs.ORDER_PICKER_ASSIGNED)
  async handleOrderPickerAssigned(job: Job<OrderPickerAssignedPayload>): Promise<void> {
    const { orderId, orderNumber, pickerId, pickerName } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `Processing ORDER_PICKER_ASSIGNED: ${orderNumber} -> ${pickerName} (jobId: ${job.id})`,
    );

    try {
      // 1. Audit Log - record picker assignment
      await this.createAuditLog({
        entityType: 'Order',
        entityId: orderId,
        action: AuditAction.ASSIGNMENT,
        metadata: {
          orderNumber,
          pickerId,
          pickerName,
          assignmentType: 'picker',
          source: 'order-events-processor',
        },
      });

      // 2. Notification Placeholder
      this.logger.log(
        `[NOTIFICATION PLACEHOLDER] Would notify picker ${pickerName} about order ${orderNumber}`,
      );

      const duration = Date.now() - startTime;
      this.logger.log(`ORDER_PICKER_ASSIGNED processed: ${orderNumber} (${duration}ms)`);
    } catch (error) {
      this.logger.error(
        `Failed to process ORDER_PICKER_ASSIGNED for ${orderNumber}:`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Handle ORDER_CANCELLED event
   * - Create audit log entry
   * - Notify customer (placeholder)
   */
  @Process(OrderEventJobs.ORDER_CANCELLED)
  async handleOrderCancelled(job: Job<OrderCancelledPayload>): Promise<void> {
    const { orderId, orderNumber, reason, cancelledBy } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing ORDER_CANCELLED: ${orderNumber} (jobId: ${job.id})`);

    try {
      // 1. Audit Log - record cancellation
      await this.createAuditLog({
        actorUserId: cancelledBy,
        entityType: 'Order',
        entityId: orderId,
        action: AuditAction.UPDATE,
        metadata: {
          orderNumber,
          reason,
          cancellationType: 'order_cancelled',
          source: 'order-events-processor',
        },
      });

      // 2. Notification Placeholder
      this.logger.log(
        `[NOTIFICATION PLACEHOLDER] Would notify customer about cancelled order ${orderNumber}. Reason: ${reason}`,
      );

      // 3. Analytics Placeholder
      this.logger.debug('[ANALYTICS PLACEHOLDER] Would increment cancelled_orders counter');

      const duration = Date.now() - startTime;
      this.logger.log(`ORDER_CANCELLED processed: ${orderNumber} (${duration}ms)`);
    } catch (error) {
      this.logger.error(
        `Failed to process ORDER_CANCELLED for ${orderNumber}:`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Create audit log entry
   * Isolated to prevent audit failures from affecting job processing
   */
  private async createAuditLog(data: {
    actorUserId?: string;
    entityType: string;
    entityId: string;
    action: AuditAction;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: data.actorUserId ?? null,
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          metadata: data.metadata ?? {},
        },
      });
    } catch (error) {
      // Log but don't throw - audit failures shouldn't fail the job
      this.logger.warn(
        `Audit log creation failed for ${data.entityType}:${data.entityId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Log status-specific notification placeholders
   */
  private logStatusNotification(orderNumber: string, status: string): void {
    const notifications: Record<string, string> = {
      PICKING: `Order ${orderNumber} is being prepared`,
      READY: `Order ${orderNumber} is ready for delivery`,
      OUT_FOR_DELIVERY: `Order ${orderNumber} is on its way`,
      DELIVERED: `Order ${orderNumber} has been delivered`,
    };

    const message = notifications[status];
    if (message) {
      this.logger.log(`[NOTIFICATION PLACEHOLDER] ${message}`);
    }
  }
}
