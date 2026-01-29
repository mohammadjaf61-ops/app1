import { Module, Global } from '@nestjs/common';

import { BusinessRulesAdminController } from './business-rules-admin.controller';
import { BusinessRulesController } from './business-rules.controller';
import { BusinessRulesService } from './business-rules.service';
import { PricingRulesService } from './pricing-rules.service';
import { StoreAvailabilityService } from './store-availability.service';

@Global()
@Module({
  controllers: [BusinessRulesController, BusinessRulesAdminController],
  providers: [BusinessRulesService, PricingRulesService, StoreAvailabilityService],
  exports: [BusinessRulesService, PricingRulesService, StoreAvailabilityService],
})
export class BusinessRulesModule {}
