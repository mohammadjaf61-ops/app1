import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { CacheService, CACHE_KEYS } from '@/modules/cache';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Application Settings Keys
 * Centralized configuration keys with their types and defaults
 */
export const SETTINGS_KEYS = {
  // Order & Delivery
  DELIVERY_FEE_IQD: 'delivery_fee_iqd',
  MIN_ORDER_AMOUNT_IQD: 'min_order_amount_iqd',

  // Analytics - Demand Forecasting
  FORECAST_DAYS: 'forecast_days',
  FORECAST_WINDOW_SIZE: 'forecast_window_size',

  // Analytics - Anomaly Detection
  ANOMALY_Z_THRESHOLD: 'anomaly_z_threshold',

  // Analytics - Basket Analysis
  BASKET_PERIOD_DAYS: 'basket_period_days',

  // Inventory
  LOW_STOCK_THRESHOLD: 'low_stock_threshold',
  NEAR_EXPIRY_DAYS: 'near_expiry_days',

  // Feature Flags
  ENABLE_DEMAND_FORECASTING: 'feature_demand_forecasting',
  ENABLE_BASKET_ANALYSIS: 'feature_basket_analysis',
  ENABLE_ANOMALY_DETECTION: 'feature_anomaly_detection',
} as const;

/**
 * Default values for all settings
 */
const SETTINGS_DEFAULTS: Record<string, number | boolean | string> = {
  // Order & Delivery
  [SETTINGS_KEYS.DELIVERY_FEE_IQD]: 5000,
  [SETTINGS_KEYS.MIN_ORDER_AMOUNT_IQD]: 10000,

  // Analytics
  [SETTINGS_KEYS.FORECAST_DAYS]: 14,
  [SETTINGS_KEYS.FORECAST_WINDOW_SIZE]: 7,
  [SETTINGS_KEYS.ANOMALY_Z_THRESHOLD]: 2.5,
  [SETTINGS_KEYS.BASKET_PERIOD_DAYS]: 30,

  // Inventory
  [SETTINGS_KEYS.LOW_STOCK_THRESHOLD]: 10,
  [SETTINGS_KEYS.NEAR_EXPIRY_DAYS]: 30,

  // Feature Flags - all enabled by default
  [SETTINGS_KEYS.ENABLE_DEMAND_FORECASTING]: true,
  [SETTINGS_KEYS.ENABLE_BASKET_ANALYSIS]: true,
  [SETTINGS_KEYS.ENABLE_ANOMALY_DETECTION]: true,
};

export type SettingKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];

/**
 * Settings Service
 *
 * Centralized configuration management with:
 * - Database-backed settings with env fallback
 * - Long TTL caching (5 minutes)
 * - Type-safe getters
 *
 * Usage:
 * ```typescript
 * const fee = await this.settingsService.getNumber(SETTINGS_KEYS.DELIVERY_FEE_IQD);
 * const enabled = await this.settingsService.getBoolean(SETTINGS_KEYS.ENABLE_DEMAND_FORECASTING);
 * ```
 */
@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private settingsCache: Map<string, unknown> = new Map();
  private cacheLoadedAt: Date | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit() {
    // Preload all settings on startup
    await this.loadAllSettings();
  }

  /**
   * Load all settings from database into memory cache
   */
  private async loadAllSettings(): Promise<void> {
    try {
      const settings = await this.prisma.setting.findMany();

      this.settingsCache.clear();
      for (const setting of settings) {
        this.settingsCache.set(setting.key, this.parseValue(setting.value));
      }
      this.cacheLoadedAt = new Date();

      this.logger.log(`Loaded ${settings.length} settings from database`);
    } catch (error) {
      this.logger.warn('Failed to load settings from database, using defaults', error);
    }
  }

  /**
   * Check if cache needs refresh
   */
  private isCacheStale(): boolean {
    if (!this.cacheLoadedAt) return true;
    return Date.now() - this.cacheLoadedAt.getTime() > this.CACHE_TTL_MS;
  }

  /**
   * Parse JSON value from database
   */
  private parseValue(jsonValue: unknown): unknown {
    if (typeof jsonValue === 'object' && jsonValue !== null) {
      // Prisma returns JSON as object, extract value
      const obj = jsonValue as Record<string, unknown>;
      return obj.value ?? jsonValue;
    }
    return jsonValue;
  }

  /**
   * Get a setting value with fallback to default
   */
  async get<T>(key: SettingKey): Promise<T> {
    // Refresh cache if stale
    if (this.isCacheStale()) {
      await this.loadAllSettings();
    }

    // Check memory cache first
    if (this.settingsCache.has(key)) {
      return this.settingsCache.get(key) as T;
    }

    // Return default
    return SETTINGS_DEFAULTS[key] as T;
  }

  /**
   * Get a number setting
   */
  async getNumber(key: SettingKey, defaultOverride?: number): Promise<number> {
    const value = await this.get<number>(key);
    if (typeof value === 'number') return value;
    if (typeof value === 'string')
      return parseFloat(value) || (defaultOverride ?? (SETTINGS_DEFAULTS[key] as number));
    return defaultOverride ?? (SETTINGS_DEFAULTS[key] as number);
  }

  /**
   * Get a boolean setting (typically feature flags)
   */
  async getBoolean(key: SettingKey, defaultOverride?: boolean): Promise<boolean> {
    const value = await this.get<boolean>(key);
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true' || value === '1';
    return defaultOverride ?? (SETTINGS_DEFAULTS[key] as boolean);
  }

  /**
   * Get a string setting
   */
  async getString(key: SettingKey, defaultOverride?: string): Promise<string> {
    const value = await this.get<string>(key);
    if (typeof value === 'string') return value;
    return defaultOverride ?? String(SETTINGS_DEFAULTS[key] ?? '');
  }

  /**
   * Get all settings as a map (for admin dashboard)
   */
  async getAll(): Promise<Record<string, unknown>> {
    if (this.isCacheStale()) {
      await this.loadAllSettings();
    }

    const result: Record<string, unknown> = { ...SETTINGS_DEFAULTS };
    for (const [key, value] of this.settingsCache.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Update a setting (for future admin UI)
   */
  async set(key: SettingKey, value: unknown, description?: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      update: {
        value: { value } as object,
        description,
      },
      create: {
        key,
        value: { value } as object,
        description,
      },
    });

    // Update memory cache
    this.settingsCache.set(key, value);

    // Invalidate Redis cache
    await this.cacheService.del(`${CACHE_KEYS.SETTINGS}:${key}`);

    this.logger.log(`Setting updated: ${key} = ${JSON.stringify(value)}`);
  }

  /**
   * Invalidate all cached settings
   */
  async invalidateCache(): Promise<void> {
    this.settingsCache.clear();
    this.cacheLoadedAt = null;
    await this.cacheService.delPattern(`${CACHE_KEYS.SETTINGS}:*`);
    this.logger.log('Settings cache invalidated');
  }
}
