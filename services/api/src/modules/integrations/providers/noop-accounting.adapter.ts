import { Injectable } from '@nestjs/common';

import { createLogger, StructuredLogger } from '@/common/observability';

import { AccountingAdapter, AccountingEntry, AccountingSyncResult } from '../interfaces';

@Injectable()
export class NoopAccountingAdapter implements AccountingAdapter {
  private readonly logger: StructuredLogger;

  constructor() {
    this.logger = createLogger('NoopAccountingAdapter');
  }

  async syncTransaction(entry: AccountingEntry): Promise<AccountingSyncResult> {
    this.logger.log('Accounting sync (noop)', {
      orderId: entry.orderId,
      orderNumber: entry.orderNumber,
      type: entry.type,
      amountIqd: entry.amountIqd,
      paymentMethod: entry.paymentMethod,
    });

    return {
      success: true,
      externalId: `noop-${entry.orderId}`,
    };
  }

  getAdapterName(): string {
    return 'noop';
  }
}
