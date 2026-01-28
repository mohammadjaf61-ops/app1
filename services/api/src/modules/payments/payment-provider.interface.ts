/**
 * Payment Provider Adapter Interface
 * Provides abstraction for different payment gateways
 *
 * Implementations can be added for:
 * - ZainCash
 * - AsiaHawala
 * - FastPay
 * - etc.
 */
export interface PaymentProviderAdapter {
  /**
   * Provider name (e.g., 'zaincash', 'asiahawala')
   */
  readonly name: string;

  /**
   * Initiate a payment with the provider
   * @param request Payment initiation request
   * @returns Provider-specific payment reference
   */
  initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse>;

  /**
   * Verify a payment with the provider
   * @param providerRef Provider reference from initiation
   * @returns Verification result
   */
  verifyPayment(providerRef: string): Promise<VerifyPaymentResponse>;

  /**
   * Handle webhook callback from provider
   * @param payload Raw webhook payload
   * @returns Parsed payment status
   */
  handleWebhook?(payload: unknown): Promise<WebhookResult>;
}

export interface InitiatePaymentRequest {
  orderId: string;
  amountIqd: number;
  customerPhone: string;
  description: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface InitiatePaymentResponse {
  providerRef: string;
  redirectUrl?: string;
  expiresAt?: Date;
  rawResponse?: unknown;
}

export interface VerifyPaymentResponse {
  isPaid: boolean;
  providerRef: string;
  paidAt?: Date;
  failureReason?: string;
  rawResponse?: unknown;
}

export interface WebhookResult {
  orderId: string;
  providerRef: string;
  status: 'PAID' | 'FAILED';
  paidAt?: Date;
  failureReason?: string;
}

/**
 * Token for dependency injection
 */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
