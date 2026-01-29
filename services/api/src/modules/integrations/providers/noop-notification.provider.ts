import { Injectable } from '@nestjs/common';

import { createLogger, StructuredLogger } from '@/common/observability';

import { NotificationPayload, NotificationProvider, NotificationResult } from '../interfaces';

@Injectable()
export class NoopNotificationProvider implements NotificationProvider {
  private readonly logger: StructuredLogger;

  constructor() {
    this.logger = createLogger('NoopNotificationProvider');
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    this.logger.log('Push notification send (noop)', {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
    });

    return {
      success: true,
      notificationId: `noop-${Date.now()}`,
    };
  }

  async sendToTopic(topic: string, payload: NotificationPayload): Promise<NotificationResult> {
    this.logger.log('Push notification to topic (noop)', {
      topic,
      type: payload.type,
      title: payload.title,
    });

    return {
      success: true,
      notificationId: `noop-topic-${Date.now()}`,
    };
  }

  getProviderName(): string {
    return 'noop';
  }
}
