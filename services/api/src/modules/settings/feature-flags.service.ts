import { Injectable, Logger } from '@nestjs/common';

import { SettingsService, SETTINGS_KEYS } from './settings.service';

/**
 * Feature Flag Keys
 */
export const FEATURE_FLAGS = {
  DEMAND_FORECASTING: SETTINGS_KEYS.ENABLE_DEMAND_FORECASTING,
  BASKET_ANALYSIS: SETTINGS_KEYS.ENABLE_BASKET_ANALYSIS,
  ANOMALY_DETECTION: SETTINGS_KEYS.ENABLE_ANOMALY_DETECTION,
  AI_INSIGHTS: SETTINGS_KEYS.ENABLE_AI_INSIGHTS,
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/**
 * Feature Flags Service
 *
 * Simple wrapper for feature flag checks with logging.
 *
 * Usage:
 * ```typescript
 * if (await this.featureFlags.isEnabled(FEATURE_FLAGS.DEMAND_FORECASTING)) {
 *   // Run forecasting logic
 * }
 *
 * // Or with decorator pattern
 * const result = await this.featureFlags.runIfEnabled(
 *   FEATURE_FLAGS.BASKET_ANALYSIS,
 *   () => this.analyzeBaskets()
 * );
 * ```
 */
@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Check if a feature flag is enabled
   */
  async isEnabled(flag: FeatureFlagKey): Promise<boolean> {
    const enabled = await this.settingsService.getBoolean(flag, true);
    return enabled;
  }

  /**
   * Check if a feature flag is disabled
   */
  async isDisabled(flag: FeatureFlagKey): Promise<boolean> {
    return !(await this.isEnabled(flag));
  }

  /**
   * Run a function only if feature is enabled
   * Returns undefined if feature is disabled
   */
  async runIfEnabled<T>(flag: FeatureFlagKey, fn: () => Promise<T>): Promise<T | undefined> {
    if (await this.isEnabled(flag)) {
      return fn();
    }
    this.logger.debug(`Feature ${flag} is disabled, skipping execution`);
    return undefined;
  }

  /**
   * Run a function only if feature is enabled, with fallback
   */
  async runIfEnabledOr<T>(flag: FeatureFlagKey, fn: () => Promise<T>, fallback: T): Promise<T> {
    if (await this.isEnabled(flag)) {
      return fn();
    }
    this.logger.debug(`Feature ${flag} is disabled, using fallback`);
    return fallback;
  }

  /**
   * Get all feature flag states
   */
  async getAllFlags(): Promise<Record<string, boolean>> {
    const flags: Record<string, boolean> = {};
    for (const [name, key] of Object.entries(FEATURE_FLAGS)) {
      flags[name] = await this.isEnabled(key);
    }
    return flags;
  }

  /**
   * Log feature flag state (useful for debugging)
   */
  async logFlagStates(): Promise<void> {
    const flags = await this.getAllFlags();
    this.logger.log('Feature flag states:', flags);
  }
}
