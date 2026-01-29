import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { CacheModule } from '@/modules/cache';

import { MonitoringController } from './monitoring.controller';
import { MetricsService } from './metrics.service';
import { AlertsService } from './alerts.service';
import { MetricsInterceptor } from './metrics.interceptor';

@Module({
  imports: [
    CacheModule,
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
  controllers: [MonitoringController],
  providers: [MetricsService, AlertsService, MetricsInterceptor],
  exports: [MetricsService, AlertsService, MetricsInterceptor],
})
export class MonitoringModule {}
