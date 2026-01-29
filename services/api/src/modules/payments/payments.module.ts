import { Module, Global } from '@nestjs/common';

import { PAYMENT_PROVIDER } from './payment-provider.interface';
import { PaymentsAdminController } from './payments-admin.controller';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PlaceholderPaymentProvider } from './providers/placeholder.provider';

@Global()
@Module({
  controllers: [PaymentsController, PaymentsAdminController],
  providers: [
    PaymentsService,
    // Use placeholder provider - replace with real provider when ready
    {
      provide: PAYMENT_PROVIDER,
      useClass: PlaceholderPaymentProvider,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
