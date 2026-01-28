import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService, CACHE_KEYS } from '@/modules/cache';
import { StructuredLogger, createLogger } from '@/common/observability';

/**
 * Validation result for order pricing rules
 */
export interface PricingValidationResult {
  isValid: boolean;
  errorCode?: string;
  minimumOrderIqd?: number;
  currentTotalIqd?: number;
  deliveryFeeIqd?: number;
  zoneName?: string;
}

/**
 * Delivery zone information for frontend display
 */
export interface DeliveryZoneInfo {
  id: string;
  nameAr: string;
  nameEn?: string;
  feeIqd: number;
  minOrderIqd: number;
  estimatedMinutes?: number;
  isActive: boolean;
}

@Injectable()
export class PricingRulesService {
  private readonly logger: StructuredLogger;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    this.logger = createLogger('PricingRulesService');
  }

  /**
   * Get all active delivery zones
   */
  async getActiveDeliveryZones(): Promise<DeliveryZoneInfo[]> {
    const cacheKey = `${CACHE_KEYS.SETTINGS}:delivery_zones`;

    const cached = await this.cache.get<DeliveryZoneInfo[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const zones = await this.prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
    });

    type ZoneRow = (typeof zones)[number];
    const result: DeliveryZoneInfo[] = zones.map((zone: ZoneRow) => ({
      id: zone.id,
      nameAr: zone.nameAr,
      nameEn: zone.nameEn ?? undefined,
      feeIqd: zone.feeIqd,
      minOrderIqd: zone.minOrderIqd,
      estimatedMinutes: zone.estimatedMinutes ?? undefined,
      isActive: zone.isActive,
    }));

    await this.cache.set(cacheKey, result, this.CACHE_TTL_MS);
    return result;
  }

  /**
   * Get delivery zone by ID
   */
  async getDeliveryZoneById(zoneId: string): Promise<DeliveryZoneInfo | null> {
    const zone = await this.prisma.deliveryZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      return null;
    }

    return {
      id: zone.id,
      nameAr: zone.nameAr,
      nameEn: zone.nameEn ?? undefined,
      feeIqd: zone.feeIqd,
      minOrderIqd: zone.minOrderIqd,
      estimatedMinutes: zone.estimatedMinutes ?? undefined,
      isActive: zone.isActive,
    };
  }

  /**
   * Validate minimum order amount for a zone
   */
  async validateMinOrder(totalAmountIqd: number, zoneId: string): Promise<PricingValidationResult> {
    const zone = await this.getDeliveryZoneById(zoneId);

    if (!zone) {
      this.logger.warn('Delivery zone not found', { zoneId });
      return {
        isValid: false,
        errorCode: 'errors.deliveryUnavailable',
      };
    }

    if (!zone.isActive) {
      this.logger.warn('Delivery zone is inactive', { zoneId, zoneName: zone.nameAr });
      return {
        isValid: false,
        errorCode: 'errors.deliveryUnavailable',
        zoneName: zone.nameAr,
      };
    }

    if (totalAmountIqd < zone.minOrderIqd) {
      this.logger.log('Order below minimum', {
        totalAmountIqd,
        minOrderIqd: zone.minOrderIqd,
        zoneId,
      });
      return {
        isValid: false,
        errorCode: 'businessRules.belowMinimumOrder',
        minimumOrderIqd: zone.minOrderIqd,
        currentTotalIqd: totalAmountIqd,
        zoneName: zone.nameAr,
      };
    }

    return {
      isValid: true,
      deliveryFeeIqd: zone.feeIqd,
      zoneName: zone.nameAr,
    };
  }

  /**
   * Get delivery fee for a zone
   */
  async getDeliveryFee(zoneId: string): Promise<number> {
    const zone = await this.getDeliveryZoneById(zoneId);

    if (!zone || !zone.isActive) {
      throw new BadRequestException({
        errorCode: 'errors.deliveryUnavailable',
        message: 'Delivery zone not available',
      });
    }

    return zone.feeIqd;
  }

  /**
   * Calculate full order pricing with delivery
   */
  async calculateOrderTotal(
    subtotalIqd: number,
    zoneId: string,
  ): Promise<{
    subtotalIqd: number;
    deliveryFeeIqd: number;
    totalIqd: number;
    zoneName: string;
  }> {
    const zone = await this.getDeliveryZoneById(zoneId);

    if (!zone || !zone.isActive) {
      throw new BadRequestException({
        errorCode: 'errors.deliveryUnavailable',
        message: 'Delivery zone not available',
      });
    }

    return {
      subtotalIqd,
      deliveryFeeIqd: zone.feeIqd,
      totalIqd: subtotalIqd + zone.feeIqd,
      zoneName: zone.nameAr,
    };
  }

  /**
   * Invalidate cached delivery zones (call after admin updates)
   */
  async invalidateCache(): Promise<void> {
    await this.cache.del(`${CACHE_KEYS.SETTINGS}:delivery_zones`);
    this.logger.log('Delivery zones cache invalidated');
  }
}
