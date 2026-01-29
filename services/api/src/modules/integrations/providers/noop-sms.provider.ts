import { Injectable } from '@nestjs/common';

import { createLogger, StructuredLogger } from '@/common/observability';

import { SmsPayload, SmsProvider, SmsResult } from '../interfaces';

@Injectable()
export class NoopSmsProvider implements SmsProvider {
  private readonly logger: StructuredLogger;

  constructor() {
    this.logger = createLogger('NoopSmsProvider');
  }

  async send(payload: SmsPayload): Promise<SmsResult> {
    this.logger.log('SMS send (noop)', {
      to: payload.to,
      type: payload.type,
      orderId: payload.orderId,
      messageLength: payload.message.length,
    });

    return {
      success: true,
      messageId: `noop-${Date.now()}`,
    };
  }

  getProviderName(): string {
    return 'noop';
  }
}
