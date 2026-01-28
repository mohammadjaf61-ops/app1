import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { SettingsService, SETTINGS_KEYS } from '../../settings';

import { AiGovernanceService } from './ai-governance.service';

interface BasketPair {
  product_id_a: string;
  product_id_b: string;
  sku_a: string;
  sku_b: string;
  co_occurrence_count: bigint;
}

@Injectable()
export class BasketAnalysisService {
  private readonly logger = new Logger(BasketAnalysisService.name);

  // Minimum co-occurrence count to consider
  private readonly MIN_SUPPORT_COUNT = 3;
  // Minimum lift to store
  private readonly MIN_LIFT = 1.0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly governance: AiGovernanceService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Perform basket analysis to find frequently co-purchased products
   */
  async analyzeBaskets(periodDaysOverride?: number): Promise<number> {
    const startTime = Date.now();

    // Get period days from settings or use override
    const periodDays =
      periodDaysOverride ?? (await this.settingsService.getNumber(SETTINGS_KEYS.BASKET_PERIOD_DAYS));

    this.logger.log(`Analyzing baskets for last ${periodDays} days`);

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    const periodEnd = new Date();

    // Get total order count for support calculation
    const orderCount = await this.prisma.order.count({
      where: {
        createdAt: { gte: periodStart },
        status: { not: 'CANCELLED' },
      },
    });

    if (orderCount < 10) {
      this.logger.warn('Not enough orders for basket analysis');
      return 0;
    }

    // Get product purchase counts for confidence calculation
    const productCounts = await this.getProductPurchaseCounts(periodStart);

    // Get co-purchase pairs
    const pairs = await this.getCoOccurrencePairs(periodStart);

    let analysisCount = 0;

    // Delete old analysis for this period
    await this.prisma.basketAnalysis.deleteMany({
      where: {
        periodStart,
        periodEnd,
      },
    });

    for (const pair of pairs) {
      const coCount = Number(pair.co_occurrence_count);

      // Calculate association metrics
      const support = coCount / orderCount;
      const countA = productCounts.get(pair.product_id_a) || 1;
      const countB = productCounts.get(pair.product_id_b) || 1;

      // Confidence: P(B|A) = P(A and B) / P(A)
      const confidence = coCount / countA;

      // Lift: P(A and B) / (P(A) * P(B))
      const probA = countA / orderCount;
      const probB = countB / orderCount;
      const lift = support / (probA * probB);

      // Only store significant associations
      if (lift >= this.MIN_LIFT && coCount >= this.MIN_SUPPORT_COUNT) {
        await this.prisma.basketAnalysis.create({
          data: {
            productIdA: pair.product_id_a,
            productIdB: pair.product_id_b,
            skuA: pair.sku_a,
            skuB: pair.sku_b,
            coOccurrenceCount: coCount,
            support,
            confidence,
            lift,
            periodStart,
            periodEnd,
          },
        });
        analysisCount++;
      }
    }

    // Log AI output
    await this.governance.logOutput({
      outputType: 'BASKET',
      modelName: 'association_rules',
      modelVersion: '1.0',
      inputParams: {
        periodDays,
        orderCount,
        minSupportCount: this.MIN_SUPPORT_COUNT,
        minLift: this.MIN_LIFT,
      },
      outputData: {
        pairsAnalyzed: pairs.length,
        significantPairs: analysisCount,
      },
      processingMs: Date.now() - startTime,
    });

    this.logger.log(`Basket analysis complete: ${analysisCount} significant associations`);
    return analysisCount;
  }

  /**
   * Get product purchase counts
   */
  private async getProductPurchaseCounts(startDate: Date): Promise<Map<string, number>> {
    const counts = await this.prisma.$queryRaw<Array<{ product_id: string; order_count: bigint }>>`
      SELECT
        oi.product_id,
        COUNT(DISTINCT o.id)::BIGINT as order_count
      FROM order_item oi
      JOIN "order" o ON oi.order_id = o.id
      WHERE o.created_at >= ${startDate}
        AND o.status != 'CANCELLED'
      GROUP BY oi.product_id
    `;

    return new Map(
      counts.map((c: { product_id: string; order_count: bigint }) => [
        c.product_id,
        Number(c.order_count),
      ]),
    );
  }

  /**
   * Get co-occurrence pairs
   */
  private async getCoOccurrencePairs(startDate: Date): Promise<BasketPair[]> {
    return this.prisma.$queryRaw<BasketPair[]>`
      SELECT
        oi1.product_id as product_id_a,
        oi2.product_id as product_id_b,
        p1.sku as sku_a,
        p2.sku as sku_b,
        COUNT(DISTINCT oi1.order_id)::BIGINT as co_occurrence_count
      FROM order_item oi1
      JOIN order_item oi2 ON oi1.order_id = oi2.order_id
        AND oi1.product_id < oi2.product_id
      JOIN "order" o ON oi1.order_id = o.id
      JOIN product p1 ON oi1.product_id = p1.id
      JOIN product p2 ON oi2.product_id = p2.id
      WHERE o.created_at >= ${startDate}
        AND o.status != 'CANCELLED'
      GROUP BY oi1.product_id, oi2.product_id, p1.sku, p2.sku
      HAVING COUNT(DISTINCT oi1.order_id) >= ${this.MIN_SUPPORT_COUNT}
      ORDER BY co_occurrence_count DESC
      LIMIT 1000
    `;
  }

  /**
   * Get product recommendations based on basket analysis
   */
  async getRecommendations(
    productId: string,
    limit: number = 5,
  ): Promise<
    Array<{
      productId: string;
      sku: string;
      lift: number;
      confidence: number;
      coOccurrenceCount: number;
    }>
  > {
    const recommendations = await this.prisma.basketAnalysis.findMany({
      where: {
        OR: [{ productIdA: productId }, { productIdB: productId }],
        lift: { gte: 1.2 }, // Only recommend if lift > 1.2
      },
      orderBy: { lift: 'desc' },
      take: limit * 2, // Get more to filter
    });

    // Map to recommended product (the one that's not the input)
    type RecommendationType = (typeof recommendations)[number];
    return recommendations
      .map((r: RecommendationType) => ({
        productId: r.productIdA === productId ? r.productIdB : r.productIdA,
        sku: r.productIdA === productId ? r.skuB : r.skuA,
        lift: r.lift,
        confidence: r.confidence,
        coOccurrenceCount: r.coOccurrenceCount,
      }))
      .slice(0, limit);
  }

  /**
   * Get top product pairs by lift
   */
  async getTopProductPairs(limit: number = 20): Promise<
    Array<{
      productA: { id: string; sku: string };
      productB: { id: string; sku: string };
      lift: number;
      confidence: number;
      support: number;
      coOccurrenceCount: number;
    }>
  > {
    const pairs = await this.prisma.basketAnalysis.findMany({
      orderBy: { lift: 'desc' },
      take: limit,
    });

    type PairType = (typeof pairs)[number];
    return pairs.map((p: PairType) => ({
      productA: { id: p.productIdA, sku: p.skuA },
      productB: { id: p.productIdB, sku: p.skuB },
      lift: p.lift,
      confidence: p.confidence,
      support: p.support,
      coOccurrenceCount: p.coOccurrenceCount,
    }));
  }
}
