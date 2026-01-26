import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { AggregationService } from '../services/aggregation.service';
import { DemandForecastService } from '../services/demand-forecast.service';
import { ReorderService } from '../services/reorder.service';
import { BasketAnalysisService } from '../services/basket-analysis.service';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { AiGovernanceService } from '../services/ai-governance.service';

@Processor('analytics')
export class AnalyticsProcessor {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    private readonly aggregation: AggregationService,
    private readonly demandForecast: DemandForecastService,
    private readonly reorder: ReorderService,
    private readonly basketAnalysis: BasketAnalysisService,
    private readonly anomalyDetection: AnomalyDetectionService,
    private readonly governance: AiGovernanceService,
  ) {}

  @Process('daily-sales-aggregation')
  async handleDailySalesAggregation(job: Job) {
    const startedAt = new Date();
    const jobName = 'daily-sales-aggregation';

    this.logger.log(`Processing ${jobName}`);

    try {
      const date = job.data.date ? new Date(job.data.date) : new Date();

      // Compute daily sales
      const orderCount = await this.aggregation.computeDailySales(date);

      // Compute category sales
      const categoryCount = await this.aggregation.computeCategorySales(date);

      // Refresh materialized views
      await this.aggregation.refreshMaterializedViews();

      await this.governance.logJobExecution(jobName, 'COMPLETED', {
        startedAt,
        completedAt: new Date(),
        recordsProcessed: orderCount + categoryCount,
        metadata: { date: date.toISOString() },
      });

      return { orderCount, categoryCount };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.governance.logJobExecution(jobName, 'FAILED', {
        startedAt,
        completedAt: new Date(),
        errorMessage: error.message,
        errorStack: error.stack,
      });
      throw error;
    }
  }

  @Process('product-analytics')
  async handleProductAnalytics(job: Job) {
    const startedAt = new Date();
    const jobName = 'product-analytics';

    this.logger.log(`Processing ${jobName}`);

    try {
      const date = job.data.date ? new Date(job.data.date) : new Date();
      const productCount = await this.aggregation.computeProductAnalytics(date);

      await this.governance.logJobExecution(jobName, 'COMPLETED', {
        startedAt,
        completedAt: new Date(),
        recordsProcessed: productCount,
      });

      return { productCount };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.governance.logJobExecution(jobName, 'FAILED', {
        startedAt,
        completedAt: new Date(),
        errorMessage: error.message,
        errorStack: error.stack,
      });
      throw error;
    }
  }

  @Process('demand-forecast')
  async handleDemandForecast(job: Job) {
    const startedAt = new Date();
    const jobName = 'demand-forecast';

    this.logger.log(`Processing ${jobName}`);

    try {
      const forecastDays = job.data.forecastDays || 14;
      const forecastCount = await this.demandForecast.generateForecasts(forecastDays);

      await this.governance.logJobExecution(jobName, 'COMPLETED', {
        startedAt,
        completedAt: new Date(),
        recordsProcessed: forecastCount,
        metadata: { forecastDays },
      });

      return { forecastCount };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.governance.logJobExecution(jobName, 'FAILED', {
        startedAt,
        completedAt: new Date(),
        errorMessage: error.message,
        errorStack: error.stack,
      });
      throw error;
    }
  }

  @Process('reorder-recommendations')
  async handleReorderRecommendations(job: Job) {
    const startedAt = new Date();
    const jobName = 'reorder-recommendations';

    this.logger.log(`Processing ${jobName}`);

    try {
      const recommendationCount = await this.reorder.generateRecommendations();

      await this.governance.logJobExecution(jobName, 'COMPLETED', {
        startedAt,
        completedAt: new Date(),
        recordsProcessed: recommendationCount,
      });

      return { recommendationCount };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.governance.logJobExecution(jobName, 'FAILED', {
        startedAt,
        completedAt: new Date(),
        errorMessage: error.message,
        errorStack: error.stack,
      });
      throw error;
    }
  }

  @Process('basket-analysis')
  async handleBasketAnalysis(job: Job) {
    const startedAt = new Date();
    const jobName = 'basket-analysis';

    this.logger.log(`Processing ${jobName}`);

    try {
      const periodDays = job.data.periodDays || 30;
      const analysisCount = await this.basketAnalysis.analyzeBaskets(periodDays);

      await this.governance.logJobExecution(jobName, 'COMPLETED', {
        startedAt,
        completedAt: new Date(),
        recordsProcessed: analysisCount,
        metadata: { periodDays },
      });

      return { analysisCount };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.governance.logJobExecution(jobName, 'FAILED', {
        startedAt,
        completedAt: new Date(),
        errorMessage: error.message,
        errorStack: error.stack,
      });
      throw error;
    }
  }

  @Process('anomaly-detection')
  async handleAnomalyDetection(job: Job) {
    const startedAt = new Date();
    const jobName = 'anomaly-detection';

    this.logger.log(`Processing ${jobName}`);

    try {
      const anomalyCount = await this.anomalyDetection.detectAnomalies();

      await this.governance.logJobExecution(jobName, 'COMPLETED', {
        startedAt,
        completedAt: new Date(),
        recordsProcessed: anomalyCount,
      });

      return { anomalyCount };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.governance.logJobExecution(jobName, 'FAILED', {
        startedAt,
        completedAt: new Date(),
        errorMessage: error.message,
        errorStack: error.stack,
      });
      throw error;
    }
  }

  @Process('stock-status-refresh')
  async handleStockStatusRefresh(job: Job) {
    const startedAt = new Date();
    const jobName = 'stock-status-refresh';

    this.logger.log(`Processing ${jobName}`);

    try {
      await this.aggregation.refreshMaterializedViews();

      await this.governance.logJobExecution(jobName, 'COMPLETED', {
        startedAt,
        completedAt: new Date(),
      });

      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.governance.logJobExecution(jobName, 'FAILED', {
        startedAt,
        completedAt: new Date(),
        errorMessage: error.message,
        errorStack: error.stack,
      });
      throw error;
    }
  }
}
