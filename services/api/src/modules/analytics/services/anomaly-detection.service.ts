import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { SettingsService, SETTINGS_KEYS } from '../../settings';

import { AiGovernanceService } from './ai-governance.service';

interface AnomalyResult {
  alertType: string;
  severity: string;
  entityType: string;
  entityId?: string;
  descriptionAr: string;
  detectedValue: number;
  expectedValue?: number;
  deviationPct?: number;
}

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly governance: AiGovernanceService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get Z-score threshold from settings
   */
  private async getZThreshold(): Promise<number> {
    return this.settingsService.getNumber(SETTINGS_KEYS.ANOMALY_Z_THRESHOLD);
  }

  /**
   * Run all anomaly detection checks
   */
  async detectAnomalies(): Promise<number> {
    const startTime = Date.now();
    this.logger.log('Running anomaly detection');

    // Get Z-threshold from settings
    const zThreshold = await this.getZThreshold();

    const anomalies: AnomalyResult[] = [];

    // Check for refund spikes
    const refundAnomalies = await this.detectRefundSpikes(zThreshold);
    anomalies.push(...refundAnomalies);

    // Check for unusual order values
    const orderAnomalies = await this.detectUnusualOrders(zThreshold);
    anomalies.push(...orderAnomalies);

    // Check for inventory discrepancies
    const inventoryAnomalies = await this.detectInventoryAnomalies();
    anomalies.push(...inventoryAnomalies);

    // Check for unusual sales patterns
    const salesAnomalies = await this.detectSalesAnomalies();
    anomalies.push(...salesAnomalies);

    // Store anomalies
    for (const anomaly of anomalies) {
      await this.prisma.anomalyAlert.create({
        data: {
          ...anomaly,
          detectionMethod: 'z_score_statistical',
        },
      });
    }

    // Log AI output
    await this.governance.logOutput({
      outputType: 'ANOMALY',
      modelName: 'statistical_anomaly_detector',
      modelVersion: '1.0',
      inputParams: { zThreshold },
      outputData: {
        totalAnomalies: anomalies.length,
        byType: this.groupByType(anomalies),
      },
      processingMs: Date.now() - startTime,
    });

    this.logger.log(`Detected ${anomalies.length} anomalies`);
    return anomalies.length;
  }

  /**
   * Detect refund spikes
   */
  private async detectRefundSpikes(zThreshold: number): Promise<AnomalyResult[]> {
    const anomalies: AnomalyResult[] = [];

    // Get daily refund stats for last 30 days
    const refundStats = await this.prisma.$queryRaw<
      Array<{ refund_date: Date; refund_count: bigint; total_amount: bigint }>
    >`
      SELECT
        DATE(created_at) as refund_date,
        COUNT(*)::BIGINT as refund_count,
        SUM(amount_iqd)::BIGINT as total_amount
      FROM refund
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY refund_date
    `;

    if (refundStats.length < 7) {
      return anomalies;
    }

    const counts = refundStats.map((r: { refund_count: bigint }) => Number(r.refund_count));
    const amounts = refundStats.map((r: { total_amount: bigint }) => Number(r.total_amount));

    // Check today's values
    const todayCount = counts[counts.length - 1];
    const todayAmount = amounts[amounts.length - 1];

    // Calculate z-scores
    const countZScore = this.calculateZScore(todayCount, counts.slice(0, -1));
    const amountZScore = this.calculateZScore(todayAmount, amounts.slice(0, -1));

    if (countZScore > zThreshold) {
      const avgCount = this.mean(counts.slice(0, -1));
      anomalies.push({
        alertType: 'REFUND_SPIKE',
        severity: countZScore > 3 ? 'HIGH' : 'MEDIUM',
        entityType: 'Refund',
        descriptionAr: `عدد المرتجعات اليوم (${todayCount}) أعلى من المتوسط بشكل غير طبيعي`,
        detectedValue: todayCount,
        expectedValue: Math.round(avgCount),
        deviationPct: Math.round(((todayCount - avgCount) / avgCount) * 100),
      });
    }

    if (amountZScore > zThreshold) {
      const avgAmount = this.mean(amounts.slice(0, -1));
      anomalies.push({
        alertType: 'REFUND_AMOUNT_SPIKE',
        severity: amountZScore > 3 ? 'HIGH' : 'MEDIUM',
        entityType: 'Refund',
        descriptionAr: `مبلغ المرتجعات اليوم أعلى من المتوسط بشكل غير طبيعي`,
        detectedValue: todayAmount,
        expectedValue: Math.round(avgAmount),
        deviationPct: Math.round(((todayAmount - avgAmount) / avgAmount) * 100),
      });
    }

    return anomalies;
  }

  /**
   * Detect unusual order values
   */
  private async detectUnusualOrders(zThreshold: number): Promise<AnomalyResult[]> {
    const anomalies: AnomalyResult[] = [];

    // Get order value statistics
    const stats = await this.prisma.$queryRaw<[{ avg_value: number; stddev_value: number }]>`
      SELECT
        AVG(total_amount_iqd)::FLOAT as avg_value,
        STDDEV(total_amount_iqd)::FLOAT as stddev_value
      FROM "order"
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND status != 'CANCELLED'
    `;

    const { avg_value: avgValue, stddev_value: stdDev } = stats[0];

    if (!avgValue || !stdDev) {
      return anomalies;
    }

    // Find orders with unusual values in last 24 hours
    const threshold = avgValue + zThreshold * stdDev;

    const unusualOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        totalAmountIqd: { gt: Math.round(threshold) },
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmountIqd: true,
      },
    });

    for (const order of unusualOrders) {
      const zScore = (order.totalAmountIqd - avgValue) / stdDev;
      anomalies.push({
        alertType: 'UNUSUAL_ORDER_VALUE',
        severity: zScore > 3.5 ? 'HIGH' : 'MEDIUM',
        entityType: 'Order',
        entityId: order.id,
        descriptionAr: `قيمة الطلب ${order.orderNumber} (${order.totalAmountIqd.toLocaleString()} د.ع) أعلى من المتوسط بشكل غير طبيعي`,
        detectedValue: order.totalAmountIqd,
        expectedValue: Math.round(avgValue),
        deviationPct: Math.round(((order.totalAmountIqd - avgValue) / avgValue) * 100),
      });
    }

    return anomalies;
  }

  /**
   * Detect inventory anomalies
   */
  private async detectInventoryAnomalies(): Promise<AnomalyResult[]> {
    const anomalies: AnomalyResult[] = [];

    // Find products with negative or suspiciously high stock
    const suspiciousStock = await this.prisma.$queryRaw<
      Array<{
        product_id: string;
        sku: string;
        product_name: string;
        total_stock: bigint;
      }>
    >`
      SELECT
        p.id as product_id,
        p.sku,
        p.name_ar as product_name,
        COALESCE(SUM(ii.quantity), 0)::BIGINT as total_stock
      FROM product p
      LEFT JOIN inventory_item ii ON p.id = ii.product_id
      WHERE p.is_active = true AND p.deleted_at IS NULL
      GROUP BY p.id, p.sku, p.name_ar
      HAVING COALESCE(SUM(ii.quantity), 0) < 0
         OR COALESCE(SUM(ii.quantity), 0) > 10000
    `;

    for (const item of suspiciousStock) {
      const stock = Number(item.total_stock);
      anomalies.push({
        alertType: stock < 0 ? 'NEGATIVE_STOCK' : 'EXCESSIVE_STOCK',
        severity: stock < 0 ? 'HIGH' : 'LOW',
        entityType: 'Product',
        entityId: item.product_id,
        descriptionAr:
          stock < 0
            ? `المنتج ${item.sku} لديه كمية سالبة في المخزون (${stock})`
            : `المنتج ${item.sku} لديه كمية مرتفعة جداً (${stock})`,
        detectedValue: stock,
      });
    }

    return anomalies;
  }

  /**
   * Detect unusual sales patterns
   */
  private async detectSalesAnomalies(): Promise<AnomalyResult[]> {
    const anomalies: AnomalyResult[] = [];

    // Check for products with sudden sales drop
    const salesDrop = await this.prisma.$queryRaw<
      Array<{
        product_id: string;
        sku: string;
        product_name: string;
        last_week_sales: bigint;
        prev_week_sales: bigint;
      }>
    >`
      WITH last_week AS (
        SELECT oi.product_id, SUM(oi.quantity)::BIGINT as sales
        FROM order_item oi
        JOIN "order" o ON oi.order_id = o.id
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
          AND o.status != 'CANCELLED'
        GROUP BY oi.product_id
      ),
      prev_week AS (
        SELECT oi.product_id, SUM(oi.quantity)::BIGINT as sales
        FROM order_item oi
        JOIN "order" o ON oi.order_id = o.id
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '14 days'
          AND o.created_at < CURRENT_DATE - INTERVAL '7 days'
          AND o.status != 'CANCELLED'
        GROUP BY oi.product_id
      )
      SELECT
        p.id as product_id,
        p.sku,
        p.name_ar as product_name,
        COALESCE(lw.sales, 0)::BIGINT as last_week_sales,
        COALESCE(pw.sales, 0)::BIGINT as prev_week_sales
      FROM product p
      LEFT JOIN last_week lw ON p.id = lw.product_id
      LEFT JOIN prev_week pw ON p.id = pw.product_id
      WHERE p.is_active = true AND p.deleted_at IS NULL
        AND COALESCE(pw.sales, 0) > 10
        AND COALESCE(lw.sales, 0) < COALESCE(pw.sales, 0) * 0.3
    `;

    for (const item of salesDrop) {
      const lastWeek = Number(item.last_week_sales);
      const prevWeek = Number(item.prev_week_sales);
      const dropPct = Math.round(((prevWeek - lastWeek) / prevWeek) * 100);

      anomalies.push({
        alertType: 'SALES_DROP',
        severity: dropPct > 90 ? 'HIGH' : 'MEDIUM',
        entityType: 'Product',
        entityId: item.product_id,
        descriptionAr: `انخفاض حاد في مبيعات ${item.sku} بنسبة ${dropPct}% مقارنة بالأسبوع السابق`,
        detectedValue: lastWeek,
        expectedValue: prevWeek,
        deviationPct: -dropPct,
      });
    }

    return anomalies;
  }

  /**
   * Calculate z-score
   */
  private calculateZScore(value: number, data: number[]): number {
    const avg = this.mean(data);
    const stdDev = this.standardDeviation(data);
    if (stdDev === 0) {
      return 0;
    }
    return (value - avg) / stdDev;
  }

  private mean(data: number[]): number {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  private standardDeviation(data: number[]): number {
    const avg = this.mean(data);
    const squaredDiffs = data.map((x) => Math.pow(x - avg, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / data.length);
  }

  private groupByType(anomalies: AnomalyResult[]): Record<string, number> {
    return anomalies.reduce(
      (acc, a) => {
        acc[a.alertType] = (acc[a.alertType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Resolve an anomaly alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, resolutionNotes?: string): Promise<void> {
    await this.prisma.anomalyAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        resolutionNotes,
      },
    });
  }
}
