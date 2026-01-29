import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { FeatureFlagsService, FEATURE_FLAGS } from '../../settings/feature-flags.service';

import { AiGovernanceService } from './ai-governance.service';

/**
 * Insight with explanation
 * Every insight must be:
 * - Explainable (why?)
 * - Based on actual data
 * - Tied to a specific time period
 */
export interface Insight {
  id: string;
  type: 'STAGNANT_PRODUCTS' | 'PEAK_HOURS' | 'HIGH_CANCELLATION' | 'LOW_STOCK_VELOCITY';
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  explanation: InsightExplanation;
  data: unknown;
  severity: 'info' | 'warning' | 'critical';
  generatedAt: Date;
}

export interface InsightExplanation {
  reason: string;
  reasonAr: string;
  dataSource: string;
  periodDays: number;
  methodology: string;
}

/**
 * AI Insights Service (PR#24)
 *
 * Provides read-only, explainable insights for decision support.
 *
 * Key principles:
 * - AI does NOT change any decisions automatically
 * - AI does NOT affect orders or inventory directly
 * - AI explains, does not decide
 * - Every insight is explainable and tied to real data
 * - Can be disabled via feature flag
 */
@Injectable()
export class AiInsightsService {
  private readonly logger = new Logger(AiInsightsService.name);
  private readonly ANALYSIS_PERIOD_DAYS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlags: FeatureFlagsService,
    private readonly governance: AiGovernanceService,
  ) {}

  /**
   * Get all available insights
   * Returns empty array if feature is disabled
   */
  async getAllInsights(): Promise<Insight[]> {
    const isEnabled = await this.featureFlags.isEnabled(FEATURE_FLAGS.AI_INSIGHTS);

    if (!isEnabled) {
      this.logger.debug('AI Insights feature is disabled');
      return [];
    }

    const startTime = Date.now();
    const insights: Insight[] = [];

    try {
      // Generate each insight type
      const [stagnantProducts, peakHours, cancellationRate] = await Promise.all([
        this.getStagnantProductsInsight(),
        this.getPeakHoursInsight(),
        this.getCancellationRateInsight(),
      ]);

      if (stagnantProducts) {
        insights.push(stagnantProducts);
      }
      if (peakHours) {
        insights.push(peakHours);
      }
      if (cancellationRate) {
        insights.push(cancellationRate);
      }

      // Log insight generation for audit
      await this.governance.logOutput({
        outputType: 'INSIGHTS',
        modelName: 'ai_insights_v1',
        modelVersion: '1.0',
        inputParams: { periodDays: this.ANALYSIS_PERIOD_DAYS },
        outputData: { insightCount: insights.length, types: insights.map((i) => i.type) },
        processingMs: Date.now() - startTime,
      });

      return insights;
    } catch (error) {
      this.logger.error('Failed to generate insights', error);
      return [];
    }
  }

  /**
   * Insight: Stagnant Products
   * Products with very low or no sales in the analysis period
   */
  private async getStagnantProductsInsight(): Promise<Insight | null> {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - this.ANALYSIS_PERIOD_DAYS);

    // Get products with no sales in the period
    const stagnantProducts = await this.prisma.$queryRaw<
      Array<{ id: string; sku: string; name_ar: string; last_sale: Date | null }>
    >`
      SELECT
        p.id,
        p.sku,
        p.name_ar,
        MAX(o.created_at) as last_sale
      FROM product p
      LEFT JOIN order_item oi ON p.id = oi.product_id
      LEFT JOIN "order" o ON oi.order_id = o.id AND o.status != 'CANCELLED'
      WHERE p.is_active = true
        AND p.deleted_at IS NULL
      GROUP BY p.id, p.sku, p.name_ar
      HAVING MAX(o.created_at) IS NULL
         OR MAX(o.created_at) < ${periodStart}
      ORDER BY MAX(o.created_at) ASC NULLS FIRST
      LIMIT 20
    `;

    if (stagnantProducts.length === 0) {
      return null;
    }

    type StagnantProduct = { id: string; sku: string; name_ar: string; last_sale: Date | null };
    const severity: 'info' | 'warning' = stagnantProducts.length > 10 ? 'warning' : 'info';

    return {
      id: `stagnant-${Date.now()}`,
      type: 'STAGNANT_PRODUCTS',
      title: `${stagnantProducts.length} Stagnant Products`,
      titleAr: `${stagnantProducts.length} منتج راكد`,
      summary: `${stagnantProducts.length} products have not been sold in the last ${this.ANALYSIS_PERIOD_DAYS} days`,
      summaryAr: `${stagnantProducts.length} منتج لم يُباع خلال آخر ${this.ANALYSIS_PERIOD_DAYS} يوم`,
      explanation: {
        reason:
          'These products have no recorded sales in the analysis period. Consider reviewing pricing, visibility, or removing from active inventory.',
        reasonAr:
          'هذه المنتجات ليس لها مبيعات مسجلة في فترة التحليل. يُنصح بمراجعة الأسعار أو الظهور أو إزالتها من المخزون النشط.',
        dataSource: 'Orders and Products tables',
        periodDays: this.ANALYSIS_PERIOD_DAYS,
        methodology:
          'Products grouped by last sale date, filtered by those with no sales or last sale before analysis period',
      },
      data: {
        products: stagnantProducts.map((p: StagnantProduct) => ({
          id: p.id,
          sku: p.sku,
          nameAr: p.name_ar,
          lastSale: p.last_sale,
          daysSinceLastSale: p.last_sale
            ? Math.floor((Date.now() - p.last_sale.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        })),
        totalCount: stagnantProducts.length,
      },
      severity,
      generatedAt: new Date(),
    };
  }

  /**
   * Insight: Peak Hours
   * Busiest hours for orders
   */
  private async getPeakHoursInsight(): Promise<Insight | null> {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - this.ANALYSIS_PERIOD_DAYS);

    // Get order counts by hour
    const hourlyOrders = await this.prisma.$queryRaw<
      Array<{ hour: number; order_count: bigint; avg_total: number }>
    >`
      SELECT
        EXTRACT(HOUR FROM created_at)::INTEGER as hour,
        COUNT(*)::BIGINT as order_count,
        AVG(total)::NUMERIC as avg_total
      FROM "order"
      WHERE created_at >= ${periodStart}
        AND status != 'CANCELLED'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY order_count DESC
    `;

    if (hourlyOrders.length === 0) {
      return null;
    }

    type HourlyOrder = { hour: number; order_count: bigint; avg_total: number };
    const totalOrders = hourlyOrders.reduce(
      (sum: number, h: HourlyOrder) => sum + Number(h.order_count),
      0,
    );

    if (totalOrders < 10) {
      // Not enough data
      return null;
    }

    // Find peak hours (top 3)
    const peakHours = hourlyOrders.slice(0, 3).map((h: HourlyOrder) => ({
      hour: h.hour,
      orderCount: Number(h.order_count),
      avgTotal: Math.round(Number(h.avg_total)),
      percentage: Math.round((Number(h.order_count) / totalOrders) * 100),
    }));

    return {
      id: `peak-hours-${Date.now()}`,
      type: 'PEAK_HOURS',
      title: 'Peak Order Hours Identified',
      titleAr: 'تحديد ساعات الذروة',
      summary: `Most orders occur at ${peakHours[0].hour}:00 (${peakHours[0].percentage}% of orders)`,
      summaryAr: `معظم الطلبات تأتي في الساعة ${peakHours[0].hour}:00 (${peakHours[0].percentage}% من الطلبات)`,
      explanation: {
        reason:
          'Understanding peak hours helps optimize staffing and inventory preparation. Consider ensuring adequate picker and driver availability during these hours.',
        reasonAr:
          'فهم ساعات الذروة يساعد في تحسين تخصيص الموظفين وتجهيز المخزون. يُنصح بضمان توفر كافٍ للجامعين والسائقين خلال هذه الساعات.',
        dataSource: 'Orders table',
        periodDays: this.ANALYSIS_PERIOD_DAYS,
        methodology: 'Orders grouped by hour of creation, sorted by count descending',
      },
      data: {
        peakHours,
        totalOrders,
        hourlyDistribution: hourlyOrders.map((h: HourlyOrder) => ({
          hour: h.hour,
          count: Number(h.order_count),
        })),
      },
      severity: 'info',
      generatedAt: new Date(),
    };
  }

  /**
   * Insight: High Cancellation Rate
   * Monitor order cancellation trends
   */
  private async getCancellationRateInsight(): Promise<Insight | null> {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - this.ANALYSIS_PERIOD_DAYS);

    // Get order counts by status
    const orderStats = await this.prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT
        status,
        COUNT(*)::BIGINT as count
      FROM "order"
      WHERE created_at >= ${periodStart}
      GROUP BY status
    `;

    if (orderStats.length === 0) {
      return null;
    }

    type OrderStat = { status: string; count: bigint };
    const totalOrders = orderStats.reduce(
      (sum: number, s: OrderStat) => sum + Number(s.count),
      0,
    );
    const cancelledCount = Number(
      orderStats.find((s: OrderStat) => s.status === 'CANCELLED')?.count || 0,
    );

    if (totalOrders < 10) {
      // Not enough data
      return null;
    }

    const cancellationRate = (cancelledCount / totalOrders) * 100;

    // Only generate insight if cancellation rate is notable (> 5%)
    if (cancellationRate < 5) {
      return null;
    }

    let severity: 'info' | 'warning' | 'critical' = 'info';
    if (cancellationRate > 15) {
      severity = 'critical';
    } else if (cancellationRate > 10) {
      severity = 'warning';
    }

    return {
      id: `cancellation-${Date.now()}`,
      type: 'HIGH_CANCELLATION',
      title: `${cancellationRate.toFixed(1)}% Cancellation Rate`,
      titleAr: `نسبة إلغاء ${cancellationRate.toFixed(1)}%`,
      summary: `${cancelledCount} out of ${totalOrders} orders were cancelled in the last ${this.ANALYSIS_PERIOD_DAYS} days`,
      summaryAr: `${cancelledCount} من أصل ${totalOrders} طلب تم إلغاؤه في آخر ${this.ANALYSIS_PERIOD_DAYS} يوم`,
      explanation: {
        reason:
          'High cancellation rates may indicate issues with product availability, delivery times, or customer experience. Consider investigating common cancellation reasons.',
        reasonAr:
          'نسب الإلغاء المرتفعة قد تشير إلى مشاكل في توفر المنتجات أو أوقات التوصيل أو تجربة العميل. يُنصح بالتحقيق في أسباب الإلغاء الشائعة.',
        dataSource: 'Orders table',
        periodDays: this.ANALYSIS_PERIOD_DAYS,
        methodology: 'Count of cancelled orders divided by total orders',
      },
      data: {
        cancelledCount,
        totalOrders,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        statusBreakdown: orderStats.map((s: OrderStat) => ({
          status: s.status,
          count: Number(s.count),
          percentage: Math.round((Number(s.count) / totalOrders) * 100),
        })),
      },
      severity,
      generatedAt: new Date(),
    };
  }

  /**
   * Check if insights feature is enabled
   */
  async isEnabled(): Promise<boolean> {
    return this.featureFlags.isEnabled(FEATURE_FLAGS.AI_INSIGHTS);
  }
}
