import { Module } from '@nestjs/common';

import { SettingsModule } from '@/modules/settings/settings.module';

import { ACCOUNTING_ADAPTER, NOTIFICATION_PROVIDER, SMS_PROVIDER } from './interfaces';
import { IntegrationsService } from './integrations.service';
import {
  NoopAccountingAdapter,
  NoopNotificationProvider,
  NoopSmsProvider,
} from './providers';

@Module({
  imports: [SettingsModule],
  providers: [
    IntegrationsService,
    {
      provide: SMS_PROVIDER,
      useClass: NoopSmsProvider,
    },
    {
      provide: NOTIFICATION_PROVIDER,
      useClass: NoopNotificationProvider,
    },
    {
      provide: ACCOUNTING_ADAPTER,
      useClass: NoopAccountingAdapter,
    },
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
