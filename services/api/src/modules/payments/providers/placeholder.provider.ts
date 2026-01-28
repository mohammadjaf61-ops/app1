import { Injectable, NotImplementedException } from '@nestjs/common';

import type {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentProviderAdapter,
  VerifyPaymentResponse,
} from '../payment-provider.interface';

/**
 * Placeholder Payment Provider
 *
 * This is a stub implementation that throws NotImplementedException.
 * Replace with actual provider implementation (ZainCash, AsiaHawala, etc.)
 * when ready to integrate card payments.
 */
@Injectable()
export class PlaceholderPaymentProvider implements PaymentProviderAdapter {
  readonly name = 'placeholder';

  async initiatePayment(_request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    throw new NotImplementedException(
      'Card payments are not yet available. Please use Cash on Delivery (COD).',
    );
  }

  async verifyPayment(_providerRef: string): Promise<VerifyPaymentResponse> {
    throw new NotImplementedException(
      'Card payment verification is not yet available.',
    );
  }
}
