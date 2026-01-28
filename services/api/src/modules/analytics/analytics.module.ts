import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from '../../prisma/prisma.module';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { AggregationService } from './services/aggregation.service';
import { AiGovernanceService } from './services/ai-governance.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { BasketAnalysisService } from './services/basket-analysis.service';
import { DemandForecastService } from './services/demand-forecast.service';
import { ReorderService } from './services/reorder.service';

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
