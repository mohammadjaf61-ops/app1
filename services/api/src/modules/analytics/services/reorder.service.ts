import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

import { AiGovernanceService } from './ai-governance.service';

interface ProductStockInfo {
  product_id: string;
  sku: string;
  product_name: string;
  current_stock: bigint;
  cost_price: number;
  avg_daily_sales: number;
}

@Injectable()
export class ReorderService {
  private readonly logger = new Logger(ReorderService.name);

  // Configurable parameters
  private readonly DEFAULT_LEAD_TIME_DAYS = 3;
  private readonly SAFETY_STOCK_DAYS = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly governance: AiGovernanceService,
  ) {}

  /**
   * Generate reorder recommendations for all products
   */
  async generateRecommendations(): Promise<number> {
    const startTime = Date.now();
    this.logger.log('Generating reorder recommendations');

    // Get products with stock and sales data
    const products = await this.getProductStockInfo();

    let recommendationCount = 0;

    for (const product of products) {
      const recommendation = this.calculateReorderPoint(product);

      if (recommendation.urgencyLevel !== 'NONE') {
        await this.prisma.reorderRecommendation.create({
          data: {
            productId: product.product_id,
            sku: product.sku,
            productName: product.product_name,
            currentStock: Number(product.current_stock),
            avgDailySales: product.avg_daily_sales,
            reorderPoint: recommendation.reorderPoint,
            reorderQuantity: recommendation.reorderQuantity,
            leadTimeDays: this.DEFAULT_LEAD_TIME_DAYS,
            safetyStock: recommendation.safetyStock,
            urgencyLevel: recommendation.urgencyLevel,
          },
        });
        recommendationCount++;
      }
    }

    // Clean up old unreviewed recommendations (older than 7 days)
    await this.prisma.reorderRecommendation.deleteMany({
      where: {
        isReviewed: false,
        generatedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Log AI output
    await this.governance.logOutput({
      outputType: 'REORDER',
      modelName: 'reorder_point_calculator',
      modelVersion: '1.0',
      inputParams: {
        productCount: products.length,
        leadTimeDays: this.DEFAULT_LEAD_TIME_DAYS,
        safetyStockDays: this.SAFETY_STOCK_DAYS,
      },
      outputData: { recommendationCount },
      processingMs: Date.now() - startTime,
    });

    this.logger.log(`Generated ${recommendationCount} reorder recommendations`);
    return recommendationCount;
  }

  /**
   * Get product stock information with average daily sales
   */
  private async getProductStockInfo(): Promise<ProductStockInfo[]> {
    return this.prisma.$queryRaw<ProductStockInfo[]>`
      WITH daily_sales AS (
        SELECT
          oi.product_id,
          SUM(oi.quantity)::FLOAT / 7 as avg_daily_sales
        FROM order_item oi
        JOIN "order" o ON oi.order_id = o.id
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
          AND o.status != 'CANCELLED'
        GROUP BY oi.product_id
      )
      SELECT
        p.id as product_id,
        p.sku,
        p.name_ar as product_name,
        COALESCE(SUM(ii.quantity), 0)::BIGINT as current_stock,
        p.cost_price,
        COALESCE(ds.avg_daily_sales, 0) as avg_daily_sales
      FROM product p
      LEFT JOIN inventory_item ii ON p.id = ii.product_id
      LEFT JOIN daily_sales ds ON p.id = ds.product_id
      WHERE p.is_active = true AND p.deleted_at IS NULL
      GROUP BY p.id, p.sku, p.name_ar, p.cost_price, ds.avg_daily_sales
      HAVING COALESCE(ds.avg_daily_sales, 0) > 0
    `;
  }

  /**
   * Calculate reorder point and quantity for a product
   */
  private calculateReorderPoint(product: ProductStockInfo): {
    reorderPoint: number;
    reorderQuantity: number;
    safetyStock: number;
    urgencyLevel: string;
  } {
    const currentStock = Number(product.current_stock);
    const avgDailySales = product.avg_daily_sales;

    // Safety stock = average daily sales * safety days
    const safetyStock = Math.ceil(avgDailySales * this.SAFETY_STOCK_DAYS);

    // Reorder point = (lead time * daily sales) + safety stock
    const reorderPoint = Math.ceil(avgDailySales * this.DEFAULT_LEAD_TIME_DAYS + safetyStock);

    // Economic order quantity (simplified)
    // EOQ = sqrt((2 * D * S) / H)
    // D = annual demand, S = ordering cost, H = holding cost
    // Simplified: order 2 weeks of stock
    const reorderQuantity = Math.ceil(avgDailySales * 14);

    // Calculate days of stock remaining
    const daysOfStock = avgDailySales > 0 ? currentStock / avgDailySales : Infinity;

    // Determine urgency level
    let urgencyLevel = 'NONE';
    if (currentStock === 0) {
      urgencyLevel = 'CRITICAL';
    } else if (daysOfStock <= this.DEFAULT_LEAD_TIME_DAYS) {
      urgencyLevel = 'HIGH';
    } else if (daysOfStock <= this.DEFAULT_LEAD_TIME_DAYS + this.SAFETY_STOCK_DAYS) {
      urgencyLevel = 'MEDIUM';
    } else if (currentStock <= reorderPoint) {
      urgencyLevel = 'LOW';
    }

    return {
      reorderPoint,
      reorderQuantity,
      safetyStock,
      urgencyLevel,
    };
  }

  /**
   * Mark recommendation as reviewed
   */
  async reviewRecommendation(id: string, reviewedBy: string, approved: boolean): Promise<void> {
    await this.prisma.reorderRecommendation.update({
      where: { id },
      data: {
        isReviewed: true,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });

    // Log the review action
    await this.governance.logOutput({
      outputType: 'REORDER_REVIEW',
      modelName: 'human_review',
      inputParams: { recommendationId: id },
      outputData: { approved, reviewedBy },
    });
  }

  /**
   * Get stock depletion rate analysis
   */
  async getStockDepletionRates(days: number = 30): Promise<
    Array<{
      productId: string;
      sku: string;
      productName: string;
      startStock: number;
      endStock: number;
      totalSold: number;
      depletionRate: number;
      daysToZero: number | null;
    }>
  > {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.prisma.$queryRaw<
      Array<{
        product_id: string;
        sku: string;
        product_name: string;
        total_sold: bigint;
        current_stock: bigint;
      }>
    >`
      SELECT
        p.id as product_id,
        p.sku,
        p.name_ar as product_name,
        COALESCE(SUM(oi.quantity), 0)::BIGINT as total_sold,
        COALESCE((SELECT SUM(quantity) FROM inventory_item WHERE product_id = p.id), 0)::BIGINT as current_stock
      FROM product p
      LEFT JOIN order_item oi ON p.id = oi.product_id
      LEFT JOIN "order" o ON oi.order_id = o.id
        AND o.created_at >= ${startDate}
        AND o.status != 'CANCELLED'
      WHERE p.is_active = true AND p.deleted_at IS NULL
      GROUP BY p.id, p.sku, p.name_ar
      HAVING COALESCE(SUM(oi.quantity), 0) > 0
      ORDER BY COALESCE(SUM(oi.quantity), 0) DESC
    `;

    type ResultType = (typeof result)[number];
    return result.map((r: ResultType) => {
      const totalSold = Number(r.total_sold);
      const currentStock = Number(r.current_stock);
      const dailyRate = totalSold / days;
      const daysToZero = dailyRate > 0 ? currentStock / dailyRate : null;

      return {
        productId: r.product_id,
        sku: r.sku,
        productName: r.product_name,
        startStock: currentStock + totalSold, // Estimated start stock
        endStock: currentStock,
        totalSold,
        depletionRate: Math.round(dailyRate * 100) / 100,
        daysToZero: daysToZero ? Math.round(daysToZero) : null,
      };
    });
  }
}
