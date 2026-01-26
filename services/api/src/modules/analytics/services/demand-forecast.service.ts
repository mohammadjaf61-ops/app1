import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiGovernanceService } from './ai-governance.service';

interface SalesHistory {
  date: Date;
  quantity: number;
}

interface ForecastResult {
  date: Date;
  predicted: number;
  lower: number;
  upper: number;
}

@Injectable()
export class DemandForecastService {
  private readonly logger = new Logger(DemandForecastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly governance: AiGovernanceService,
  ) {}

  /**
   * Generate demand forecasts for all active products
   * Phase 1: Simple moving average and trend analysis
   * Phase 2: Would integrate Prophet or similar
   */
  async generateForecasts(forecastDays: number = 14): Promise<number> {
    const startTime = Date.now();
    this.logger.log(`Generating ${forecastDays}-day forecasts`);

    // Get active products with recent sales
    const products = await this.prisma.$queryRaw<
      Array<{ id: string; sku: string; name_ar: string }>
    >`
      SELECT DISTINCT p.id, p.sku, p.name_ar
      FROM product p
      JOIN order_item oi ON p.id = oi.product_id
      JOIN "order" o ON oi.order_id = o.id
      WHERE p.is_active = true
        AND p.deleted_at IS NULL
        AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND o.status != 'CANCELLED'
    `;

    let forecastCount = 0;

    for (const product of products) {
      try {
        const forecasts = await this.forecastProduct(product.id, product.sku, forecastDays);
        forecastCount += forecasts.length;
      } catch (error) {
        this.logger.error(`Forecast failed for ${product.sku}: ${error.message}`);
      }
    }

    // Log AI output
    await this.governance.logOutput({
      outputType: 'FORECAST',
      modelName: 'moving_average_trend',
      modelVersion: '1.0',
      inputParams: { forecastDays, productCount: products.length },
      outputData: { forecastCount },
      processingMs: Date.now() - startTime,
    });

    this.logger.log(`Generated ${forecastCount} forecasts for ${products.length} products`);
    return forecastCount;
  }

  /**
   * Forecast demand for a single product
   */
  async forecastProduct(
    productId: string,
    sku: string,
    forecastDays: number,
  ): Promise<ForecastResult[]> {
    // Get historical sales (last 60 days)
    const history = await this.getSalesHistory(productId, 60);

    if (history.length < 7) {
      // Not enough data for forecasting
      return [];
    }

    // Calculate forecasts using moving average with trend
    const forecasts = this.calculateMovingAverageForecast(history, forecastDays);

    // Store forecasts
    for (const forecast of forecasts) {
      await this.prisma.demandForecast.upsert({
        where: {
          productId_forecastDate_modelType: {
            productId,
            forecastDate: forecast.date,
            modelType: 'moving_avg_trend',
          },
        },
        create: {
          productId,
          sku,
          forecastDate: forecast.date,
          predictedQty: forecast.predicted,
          lowerBound: forecast.lower,
          upperBound: forecast.upper,
          modelType: 'moving_avg_trend',
          modelVersion: '1.0',
          confidence: this.calculateConfidence(history),
        },
        update: {
          predictedQty: forecast.predicted,
          lowerBound: forecast.lower,
          upperBound: forecast.upper,
          confidence: this.calculateConfidence(history),
          generatedAt: new Date(),
        },
      });
    }

    return forecasts;
  }

  /**
   * Get sales history for a product
   */
  private async getSalesHistory(productId: string, days: number): Promise<SalesHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await this.prisma.$queryRaw<Array<{ sale_date: Date; quantity: bigint }>>`
      SELECT
        DATE(o.created_at) as sale_date,
        SUM(oi.quantity)::BIGINT as quantity
      FROM order_item oi
      JOIN "order" o ON oi.order_id = o.id
      WHERE oi.product_id = ${productId}
        AND o.created_at >= ${startDate}
        AND o.status != 'CANCELLED'
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date ASC
    `;

    // Fill in missing days with zeros
    const result: SalesHistory[] = [];
    const salesMap = new Map(sales.map((s) => [s.sale_date.toISOString().split('T')[0], Number(s.quantity)]));

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date,
        quantity: salesMap.get(dateStr) || 0,
      });
    }

    return result;
  }

  /**
   * Calculate moving average forecast with trend
   */
  private calculateMovingAverageForecast(
    history: SalesHistory[],
    forecastDays: number,
  ): ForecastResult[] {
    const windowSize = 7; // 7-day moving average
    const quantities = history.map((h) => h.quantity);

    // Calculate moving average
    const movingAvg = this.movingAverage(quantities, windowSize);
    const lastAvg = movingAvg[movingAvg.length - 1] || 0;

    // Calculate trend (simple linear regression on recent data)
    const recentData = quantities.slice(-14);
    const trend = this.calculateTrend(recentData);

    // Calculate standard deviation for confidence intervals
    const stdDev = this.standardDeviation(quantities.slice(-30));

    const forecasts: ForecastResult[] = [];
    const today = new Date();

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      // Prediction = base average + trend * days ahead
      const predicted = Math.max(0, lastAvg + trend * i);

      // Confidence interval widens with forecast horizon
      const uncertaintyFactor = 1 + (i * 0.1); // 10% more uncertainty per day
      const margin = stdDev * 1.96 * uncertaintyFactor;

      forecasts.push({
        date: forecastDate,
        predicted: Math.round(predicted * 100) / 100,
        lower: Math.max(0, Math.round((predicted - margin) * 100) / 100),
        upper: Math.round((predicted + margin) * 100) / 100,
      });
    }

    return forecasts;
  }

  /**
   * Calculate moving average
   */
  private movingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];
    for (let i = windowSize - 1; i < data.length; i++) {
      const window = data.slice(i - windowSize + 1, i + 1);
      const avg = window.reduce((a, b) => a + b, 0) / windowSize;
      result.push(avg);
    }
    return result;
  }

  /**
   * Calculate linear trend
   */
  private calculateTrend(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  /**
   * Calculate standard deviation
   */
  private standardDeviation(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;

    const mean = data.reduce((a, b) => a + b, 0) / n;
    const squaredDiffs = data.map((x) => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
    return Math.sqrt(variance);
  }

  /**
   * Calculate forecast confidence based on data quality
   */
  private calculateConfidence(history: SalesHistory[]): number {
    // More data points = higher confidence
    const dataPointsFactor = Math.min(1, history.length / 60);

    // Less variability = higher confidence
    const quantities = history.map((h) => h.quantity);
    const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const cv = mean > 0 ? this.standardDeviation(quantities) / mean : 1;
    const variabilityFactor = Math.max(0, 1 - cv);

    // Combine factors
    return Math.round((dataPointsFactor * 0.4 + variabilityFactor * 0.6) * 100) / 100;
  }
}
