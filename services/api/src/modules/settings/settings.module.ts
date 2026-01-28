import { Global, Module } from '@nestjs/common';

import { FeatureFlagsService } from './feature-flags.service';
import { SettingsService } from './settings.service';

/**
 * Settings Module
 *
 * Global module providing centralized configuration management.
 * Exports SettingsService and FeatureFlagsService to all modules.
 */
@Global()
@Module({
  providers: [SettingsService, FeatureFlagsService],
  exports: [SettingsService, FeatureFlagsService],
})
export class SettingsModule {}
