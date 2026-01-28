import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

import { configuration, validationSchema } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './modules/cache';
import { SettingsModule } from './modules/settings';
import { BusinessRulesModule } from './modules/business-rules';
import { PaymentsModule } from './modules/payments';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // BullMQ for job queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    // Database
    PrismaModule,

    // Caching (Redis)
    CacheModule,

    // Settings (Global)
    SettingsModule,

    // Business Rules (Global)
    BusinessRulesModule,

    // Payments (Global)
    PaymentsModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    InventoryModule,
    OrdersModule,
    DeliveryModule,
    ReportsModule,
    AuditModule,
    AnalyticsModule,
    AdminModule,
  ],
})
export class AppModule {}
