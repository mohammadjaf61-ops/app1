import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { CacheModule } from '@/modules/cache';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    CacheModule,
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
