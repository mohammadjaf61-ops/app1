import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { RequestContext, StructuredLogger } from '../../../common/observability';
import { AggregationService } from '../services/aggregation.service';
import { AiGovernanceService } from '../services/ai-governance.service';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { BasketAnalysisService } from '../services/basket-analysis.service';
import { DemandForecastService } from '../services/demand-forecast.service';
import { ReorderService } from '../services/reorder.service';

@Processor('analytics')
export class AnalyticsProcessor {
  private readonly logger = new StructuredLogger(AnalyticsProcessor.name);

  /**
   * Run job within a RequestContext for proper logging
   */
  private async runWithContext<T>(jobName: string, jobId: string, fn: () => Promise<T>): Promise<T> {
    const context = RequestContext.createJobContext(jobName, jobId);
    return RequestContext.runAsync(context, fn);
  }

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
    const jobName = 'daily-sales-aggregation';
    return this.runWithContext(jobName, job.id?.toString() || '', async () => {
      const startedAt = new Date();
      this.logger.log('Job started', { jobName, jobId: job.id });

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

        this.logger.log('Job completed', { jobName, orderCount, categoryCount });
        return { orderCount, categoryCount };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.logger.error('Job failed', error.stack, { jobName, error: error.message });
        await this.governance.logJobExecution(jobName, 'FAILED', {
          startedAt,
          completedAt: new Date(),
          errorMessage: error.message,
          errorStack: error.stack,
        });
        throw error;
      }
    });
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
  async handleReorderRecommendations(_job: Job) {
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
  async handleAnomalyDetection(_job: Job) {
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
  async handleStockStatusRefresh(_job: Job) {
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
