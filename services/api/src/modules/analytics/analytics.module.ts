import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AggregationService } from './services/aggregation.service';
import { DemandForecastService } from './services/demand-forecast.service';
import { ReorderService } from './services/reorder.service';
import { BasketAnalysisService } from './services/basket-analysis.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { AiGovernanceService } from './services/ai-governance.service';
import { AnalyticsProcessor } from './processors/analytics.processor';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'analytics',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AggregationService,
    DemandForecastService,
    ReorderService,
    BasketAnalysisService,
    AnomalyDetectionService,
    AiGovernanceService,
    AnalyticsProcessor,
  ],
  exports: [AnalyticsService, AiGovernanceService],
})
export class AnalyticsModule {}
