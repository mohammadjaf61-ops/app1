import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { PrismaService } from '../../prisma/prisma.service';
import { AggregationService } from './services/aggregation.service';
import { DemandForecastService } from './services/demand-forecast.service';
import { ReorderService } from './services/reorder.service';
import { BasketAnalysisService } from './services/basket-analysis.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregation: AggregationService,
    private readonly demandForecast: DemandForecastService,
    private readonly reorder: ReorderService,
    private readonly basketAnalysis: BasketAnalysisService,
    private readonly anomalyDetection: AnomalyDetectionService,
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {}

  // ============================================
  // SCHEDULED JOBS
  // ============================================

  // Run hourly: Refresh daily sales aggregations
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleDailySalesAggregation() {
    this.logger.log('Scheduling daily sales aggregation job');
    await this.analyticsQueue.add('daily-sales-aggregation', {
      date: new Date().toISOString(),
    });
  }

  // Run every 15 minutes: Refresh stock status
  @Cron('*/15 * * * *')
  async scheduleStockStatusRefresh() {
    this.logger.log('Scheduling stock status refresh job');
    await this.analyticsQueue.add('stock-status-refresh', {});
  }

  // Run daily at 2 AM: Product analytics and forecasting
  @Cron('0 2 * * *')
  async scheduleDailyAnalytics() {
    this.logger.log('Scheduling daily analytics jobs');
    await this.analyticsQueue.add('product-analytics', {
      date: new Date().toISOString(),
    });
    await this.analyticsQueue.add('demand-forecast', {
      date: new Date().toISOString(),
    });
    await this.analyticsQueue.add('reorder-recommendations', {
      date: new Date().toISOString(),
    });
  }

  // Run daily at 3 AM: Basket analysis
  @Cron('0 3 * * *')
  async scheduleBasketAnalysis() {
    this.logger.log('Scheduling basket analysis job');
    await this.analyticsQueue.add('basket-analysis', {
      periodDays: 30,
    });
  }

  // Run every 2 hours: Anomaly detection
  @Cron('0 */2 * * *')
  async scheduleAnomalyDetection() {
    this.logger.log('Scheduling anomaly detection job');
    await this.analyticsQueue.add('anomaly-detection', {
      date: new Date().toISOString(),
    });
  }

  // ============================================
  // MANUAL TRIGGERS
  // ============================================

  async triggerDailySalesAggregation(date?: Date) {
    return this.analyticsQueue.add('daily-sales-aggregation', {
      date: (date || new Date()).toISOString(),
      manual: true,
    });
  }

  async triggerFullAnalyticsRun() {
    const jobs = [
      this.analyticsQueue.add('daily-sales-aggregation', { manual: true }),
      this.analyticsQueue.add('product-analytics', { manual: true }),
      this.analyticsQueue.add('demand-forecast', { manual: true }),
      this.analyticsQueue.add('reorder-recommendations', { manual: true }),
      this.analyticsQueue.add('basket-analysis', { periodDays: 30, manual: true }),
      this.analyticsQueue.add('anomaly-detection', { manual: true }),
    ];
    return Promise.all(jobs);
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  async getDailySalesReport(startDate: Date, endDate: Date) {
    return this.prisma.dailySalesReport.findMany({
      where: {
        reportDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { reportDate: 'desc' },
    });
  }

  async getCategorySales(startDate: Date, endDate: Date) {
    return this.prisma.categoryDailySales.findMany({
      where: {
        reportDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ reportDate: 'desc' }, { revenue: 'desc' }],
    });
  }

  async getTopProducts(limit: number = 10, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.productAnalytics.groupBy({
      by: ['productId', 'sku', 'productName'],
      where: {
        reportDate: { gte: startDate },
      },
      _sum: {
        quantitySold: true,
        revenue: true,
      },
      orderBy: {
        _sum: {
          revenue: 'desc',
        },
      },
      take: limit,
    });
  }

  async getReorderRecommendations(urgencyLevel?: string) {
    const where: any = { isReviewed: false };
    if (urgencyLevel) {
      where.urgencyLevel = urgencyLevel;
    }

    return this.prisma.reorderRecommendation.findMany({
      where,
      orderBy: [
        { urgencyLevel: 'desc' },
        { daysOfStock: 'asc' },
      ],
      take: 50,
    });
  }

  async getBasketRecommendations(productId: string, limit: number = 5) {
    return this.prisma.basketAnalysis.findMany({
      where: {
        productIdA: productId,
        lift: { gte: 1.5 }, // Only significant associations
      },
      orderBy: { lift: 'desc' },
      take: limit,
    });
  }

  async getActiveAlerts(severity?: string) {
    const where: any = { isResolved: false };
    if (severity) {
      where.severity = severity;
    }

    return this.prisma.anomalyAlert.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { detectedAt: 'desc' },
      ],
    });
  }

  async getDemandForecasts(productId: string, days: number = 14) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.prisma.demandForecast.findMany({
      where: {
        productId,
        forecastDate: {
          gte: new Date(),
          lte: endDate,
        },
      },
      orderBy: { forecastDate: 'asc' },
    });
  }

  async getKpiSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Today's summary
    const todayOrders = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: today },
        status: { not: 'CANCELLED' },
      },
      _count: true,
      _sum: { totalAmountIqd: true },
    });

    // Yesterday for comparison
    const yesterdayOrders = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: yesterday, lt: today },
        status: { not: 'CANCELLED' },
      },
      _sum: { totalAmountIqd: true },
    });

    // Active alerts
    const alertCounts = await this.prisma.anomalyAlert.groupBy({
      by: ['severity'],
      where: { isResolved: false },
      _count: true,
    });

    // Pending reorder recommendations
    const pendingReorders = await this.prisma.reorderRecommendation.count({
      where: { isReviewed: false, urgencyLevel: { in: ['HIGH', 'CRITICAL'] } },
    });

    // Low stock count
    const lowStock = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT product_id) as count
      FROM inventory_item
      WHERE quantity < 10
    `;

    return {
      today: {
        orders: todayOrders._count,
        revenue: todayOrders._sum.totalAmountIqd || 0,
      },
      revenueChange: yesterdayOrders._sum.totalAmountIqd
        ? ((todayOrders._sum.totalAmountIqd || 0) - yesterdayOrders._sum.totalAmountIqd) /
          yesterdayOrders._sum.totalAmountIqd
        : 0,
      alerts: alertCounts.reduce((acc, a) => ({ ...acc, [a.severity]: a._count }), {}),
      pendingReorders,
      lowStockProducts: Number(lowStock[0]?.count || 0),
    };
  }

  async getJobExecutionHistory(jobName?: string, limit: number = 20) {
    const where: any = {};
    if (jobName) {
      where.jobName = jobName;
    }

    return this.prisma.jobExecution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}
