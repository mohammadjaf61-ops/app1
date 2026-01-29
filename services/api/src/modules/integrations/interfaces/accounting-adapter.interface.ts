export interface AccountingEntry {
  orderId: string;
  orderNumber: string;
  type: 'sale' | 'refund' | 'void';
  amountIqd: number;
  paymentMethod: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AccountingSyncResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface AccountingAdapter {
  syncTransaction(entry: AccountingEntry): Promise<AccountingSyncResult>;
  getAdapterName(): string;
}

export const ACCOUNTING_ADAPTER = Symbol('ACCOUNTING_ADAPTER');
