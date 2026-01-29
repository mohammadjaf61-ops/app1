export interface NotificationPayload {
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  type: 'order_status' | 'assignment' | 'delivery' | 'system';
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationResult>;
  sendToTopic(topic: string, payload: NotificationPayload): Promise<NotificationResult>;
  getProviderName(): string;
}

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');
