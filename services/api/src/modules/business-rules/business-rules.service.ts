import { Injectable, BadRequestException } from '@nestjs/common';
import { StructuredLogger, createLogger } from '@/common/observability';
import { PricingRulesService, PricingValidationResult } from './pricing-rules.service';
import { StoreAvailabilityService, StoreAvailabilityResult } from './store-availability.service';

/**
 * Complete order validation result
 */
export interface OrderValidationResult {
  canProceed: boolean;
  errors: string[];
  storeAvailability: StoreAvailabilityResult;
  pricingValidation?: PricingValidationResult;
  deliveryFeeIqd?: number;
  totalAmountIqd?: number;
}

/**
 * Order validation request
 */
export interface ValidateOrderRequest {
  subtotalIqd: number;
  deliveryZoneId: string;
  orderTime?: Date; // Defaults to now
}

@Injectable()
export class BusinessRulesService {
  private readonly logger: StructuredLogger;

  constructor(
    private readonly pricingRules: PricingRulesService,
    private readonly storeAvailability: StoreAvailabilityService,
  ) {
    this.logger = createLogger('BusinessRulesService');
  }

  /**
   * Validate all business rules before order creation
   * Returns detailed result for frontend display
   */
  async validateOrder(request: ValidateOrderRequest): Promise<OrderValidationResult> {
    const errors: string[] = [];
    const orderTime = request.orderTime ?? new Date();

    // Check store availability
    const storeCheck = await this.storeAvailability.canPlaceOrder(orderTime);
    if (!storeCheck.canPlaceOrder) {
      errors.push(storeCheck.errorCode ?? 'businessRules.storeClosed');
    }

    // Check pricing rules (zone + minimum order)
    const pricingCheck = await this.pricingRules.validateMinOrder(
      request.subtotalIqd,
      request.deliveryZoneId,
    );

    if (!pricingCheck.isValid) {
      errors.push(pricingCheck.errorCode ?? 'errors.validationError');
    }

    const canProceed = errors.length === 0;

    this.logger.log('Order validation completed', {
      canProceed,
      errors,
      subtotalIqd: request.subtotalIqd,
      zoneId: request.deliveryZoneId,
    });

    if (!canProceed) {
      return {
        canProceed: false,
        errors,
        storeAvailability: storeCheck,
        pricingValidation: pricingCheck,
      };
    }

    // Calculate final totals
    const deliveryFeeIqd = pricingCheck.deliveryFeeIqd ?? 0;
    const totalAmountIqd = request.subtotalIqd + deliveryFeeIqd;

    return {
      canProceed: true,
      errors: [],
      storeAvailability: storeCheck,
      pricingValidation: pricingCheck,
      deliveryFeeIqd,
      totalAmountIqd,
    };
  }

  /**
   * Validate and throw if order cannot proceed
   * Use this in order creation flow
   */
  async validateOrderOrThrow(request: ValidateOrderRequest): Promise<{
    deliveryFeeIqd: number;
    totalAmountIqd: number;
  }> {
    const result = await this.validateOrder(request);

    if (!result.canProceed) {
      const primaryError = result.errors[0];

      // Construct detailed error response
      throw new BadRequestException({
        errorCode: primaryError,
        message: this.getErrorMessage(primaryError),
        details: {
          storeAvailability: result.storeAvailability,
          pricingValidation: result.pricingValidation,
        },
      });
    }

    return {
      deliveryFeeIqd: result.deliveryFeeIqd ?? 0,
      totalAmountIqd: result.totalAmountIqd ?? 0,
    };
  }

  /**
   * Get human-readable error message (backend fallback)
   * Frontend should use i18n translations
   */
  private getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      'businessRules.storeClosed': 'Store is currently closed',
      'businessRules.storeNotOpenYet': 'Store has not opened yet',
      'businessRules.orderCutoffPassed': 'Order cutoff time has passed',
      'businessRules.belowMinimumOrder': 'Order is below minimum amount',
      'errors.deliveryUnavailable': 'Delivery is not available for this zone',
    };
    return messages[errorCode] ?? 'Order validation failed';
  }
}
