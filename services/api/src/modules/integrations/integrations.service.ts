import { Inject, Injectable } from '@nestjs/common';

import { createLogger, StructuredLogger } from '@/common/observability';
import { SettingsService, SETTINGS_KEYS } from '@/modules/settings/settings.service';

import {
  ACCOUNTING_ADAPTER,
  AccountingAdapter,
  AccountingEntry,
  NOTIFICATION_PROVIDER,
  NotificationPayload,
  NotificationProvider,
  SMS_PROVIDER,
  SmsPayload,
  SmsProvider,
} from './interfaces';

@Injectable()
export class IntegrationsService {
  private readonly logger: StructuredLogger;

  constructor(
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
    @Inject(NOTIFICATION_PROVIDER) private readonly notificationProvider: NotificationProvider,
    @Inject(ACCOUNTING_ADAPTER) private readonly accountingAdapter: AccountingAdapter,
    private readonly settings: SettingsService,
  ) {
    this.logger = createLogger('IntegrationsService');
  }

  async sendSms(payload: SmsPayload): Promise<void> {
    const enabled = await this.settings.getBoolean(SETTINGS_KEYS.INTEGRATION_SMS_ENABLED);

    this.logger.log('SMS request', {
      enabled,
      provider: this.smsProvider.getProviderName(),
      type: payload.type,
      orderId: payload.orderId,
    });

    if (!enabled) {
      return;
    }

    try {
      const result = await this.smsProvider.send(payload);
      if (!result.success) {
        this.logger.warn('SMS send failed', { error: result.error, orderId: payload.orderId });
      }
    } catch (error) {
      this.logger.error('SMS send error', undefined, { error, orderId: payload.orderId });
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const enabled = await this.settings.getBoolean(SETTINGS_KEYS.INTEGRATION_NOTIFICATIONS_ENABLED);

    this.logger.log('Notification request', {
      enabled,
      provider: this.notificationProvider.getProviderName(),
      type: payload.type,
      userId: payload.userId,
    });

    if (!enabled) {
      return;
    }

    try {
      const result = await this.notificationProvider.send(payload);
      if (!result.success) {
        this.logger.warn('Notification send failed', {
          error: result.error,
          userId: payload.userId,
        });
      }
    } catch (error) {
      this.logger.error('Notification send error', undefined, { error, userId: payload.userId });
    }
  }

  async sendNotificationToTopic(topic: string, payload: NotificationPayload): Promise<void> {
    const enabled = await this.settings.getBoolean(SETTINGS_KEYS.INTEGRATION_NOTIFICATIONS_ENABLED);

    if (!enabled) {
      this.logger.log('Notification to topic skipped (disabled)', { topic, type: payload.type });
      return;
    }

    try {
      const result = await this.notificationProvider.sendToTopic(topic, payload);
      if (!result.success) {
        this.logger.warn('Topic notification failed', { error: result.error, topic });
      }
    } catch (error) {
      this.logger.error('Topic notification error', undefined, { error, topic });
    }
  }

  async syncToAccounting(entry: AccountingEntry): Promise<void> {
    const enabled = await this.settings.getBoolean(SETTINGS_KEYS.INTEGRATION_ACCOUNTING_ENABLED);

    this.logger.log('Accounting sync request', {
      enabled,
      adapter: this.accountingAdapter.getAdapterName(),
      orderId: entry.orderId,
      type: entry.type,
      amountIqd: entry.amountIqd,
    });

    if (!enabled) {
      return;
    }

    try {
      const result = await this.accountingAdapter.syncTransaction(entry);
      if (!result.success) {
        this.logger.warn('Accounting sync failed', { error: result.error, orderId: entry.orderId });
      }
    } catch (error) {
      this.logger.error('Accounting sync error', undefined, { error, orderId: entry.orderId });
    }
  }

  async onOrderCreated(order: {
    id: string;
    orderNumber: string;
    customerPhone: string;
    customerName: string;
    total: number;
  }): Promise<void> {
    await this.sendSms({
      to: order.customerPhone,
      message: `مرحباً ${order.customerName}، تم استلام طلبك رقم ${order.orderNumber}. شكراً لتسوقكم معنا.`,
      orderId: order.id,
      type: 'order_confirmation',
    });
  }

  async onOrderStatusChanged(order: {
    id: string;
    orderNumber: string;
    customerPhone: string;
    status: string;
    pickerId?: string;
    driverId?: string;
  }): Promise<void> {
    const statusMessages: Record<string, string> = {
      PICKING: `طلبكم رقم ${order.orderNumber} قيد التجهيز الآن.`,
      READY: `طلبكم رقم ${order.orderNumber} جاهز للتوصيل.`,
      OUT_FOR_DELIVERY: `طلبكم رقم ${order.orderNumber} في الطريق إليكم.`,
      DELIVERED: `تم توصيل طلبكم رقم ${order.orderNumber}. شكراً لكم.`,
      CANCELLED: `تم إلغاء طلبكم رقم ${order.orderNumber}.`,
    };

    const message = statusMessages[order.status];
    if (message) {
      await this.sendSms({
        to: order.customerPhone,
        message,
        orderId: order.id,
        type: 'status_update',
      });
    }

    if (order.pickerId && order.status === 'PICKING') {
      await this.sendNotification({
        userId: order.pickerId,
        title: 'طلب جديد',
        body: `تم تعيين الطلب ${order.orderNumber} لك`,
        type: 'assignment',
        data: { orderId: order.id, orderNumber: order.orderNumber },
      });
    }

    if (order.driverId && order.status === 'OUT_FOR_DELIVERY') {
      await this.sendNotification({
        userId: order.driverId,
        title: 'توصيل جديد',
        body: `تم تعيين الطلب ${order.orderNumber} للتوصيل`,
        type: 'delivery',
        data: { orderId: order.id, orderNumber: order.orderNumber },
      });
    }
  }

  async onPaymentCompleted(order: {
    id: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
  }): Promise<void> {
    await this.syncToAccounting({
      orderId: order.id,
      orderNumber: order.orderNumber,
      type: 'sale',
      amountIqd: order.total,
      paymentMethod: order.paymentMethod,
      timestamp: new Date(),
    });
  }
}
