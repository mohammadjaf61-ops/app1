export interface SmsPayload {
  to: string;
  message: string;
  orderId?: string;
  type: 'order_confirmation' | 'status_update' | 'delivery_update' | 'otp';
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  send(payload: SmsPayload): Promise<SmsResult>;
  getProviderName(): string;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
