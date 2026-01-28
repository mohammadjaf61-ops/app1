import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService, CACHE_KEYS } from '@/modules/cache';
import { StructuredLogger, createLogger } from '@/common/observability';

/**
 * Day of week enum matching Prisma schema
 */
export type DayOfWeek =
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

/**
 * Store hours information
 */
export interface StoreHoursInfo {
  dayOfWeek: DayOfWeek;
  openAt: string; // HH:MM format
  closeAt: string; // HH:MM format
  isClosed: boolean;
  orderCutoffMinutes: number;
}

/**
 * Store availability check result
 */
export interface StoreAvailabilityResult {
  isOpen: boolean;
  canPlaceOrder: boolean;
  errorCode?: string;
  currentTime?: string;
  openAt?: string;
  closeAt?: string;
  orderCutoffTime?: string;
  nextOpenDay?: string;
  nextOpenTime?: string;
}

/**
 * Maps JavaScript day (0=Sunday) to DayOfWeek enum
 */
const JS_DAY_TO_ENUM: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

@Injectable()
export class StoreAvailabilityService {
  private readonly logger: StructuredLogger;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    this.logger = createLogger('StoreAvailabilityService');
  }

  /**
   * Get all store hours
   */
  async getAllStoreHours(): Promise<StoreHoursInfo[]> {
    const cacheKey = `${CACHE_KEYS.SETTINGS}:store_hours`;

    const cached = await this.cache.get<StoreHoursInfo[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const hours = await this.prisma.storeHours.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });

    type HoursRow = (typeof hours)[number];
    const result: StoreHoursInfo[] = hours.map((h: HoursRow) => ({
      dayOfWeek: h.dayOfWeek as DayOfWeek,
      openAt: h.openAt,
      closeAt: h.closeAt,
      isClosed: h.isClosed,
      orderCutoffMinutes: h.orderCutoffMinutes,
    }));

    await this.cache.set(cacheKey, result, this.CACHE_TTL_MS);
    return result;
  }

  /**
   * Get store hours for a specific day
   */
  async getStoreHoursForDay(day: DayOfWeek): Promise<StoreHoursInfo | null> {
    const allHours = await this.getAllStoreHours();
    return allHours.find((h) => h.dayOfWeek === day) ?? null;
  }

  /**
   * Check if store is currently open
   */
  async isStoreOpen(now: Date = new Date()): Promise<boolean> {
    const dayOfWeek = JS_DAY_TO_ENUM[now.getDay()];
    const hours = await this.getStoreHoursForDay(dayOfWeek);

    if (!hours || hours.isClosed) {
      return false;
    }

    const currentTime = this.formatTime(now);
    return currentTime >= hours.openAt && currentTime < hours.closeAt;
  }

  /**
   * Check if orders can be placed at current time
   * Takes into account order cutoff time before closing
   */
  async canPlaceOrder(now: Date = new Date()): Promise<StoreAvailabilityResult> {
    const dayOfWeek = JS_DAY_TO_ENUM[now.getDay()];
    const hours = await this.getStoreHoursForDay(dayOfWeek);
    const currentTime = this.formatTime(now);

    // No hours configured for this day
    if (!hours) {
      const nextOpen = await this.findNextOpenDay(now);
      return {
        isOpen: false,
        canPlaceOrder: false,
        errorCode: 'businessRules.storeClosed',
        currentTime,
        ...nextOpen,
      };
    }

    // Store is closed on this day
    if (hours.isClosed) {
      const nextOpen = await this.findNextOpenDay(now);
      return {
        isOpen: false,
        canPlaceOrder: false,
        errorCode: 'businessRules.storeClosed',
        currentTime,
        ...nextOpen,
      };
    }

    // Before opening
    if (currentTime < hours.openAt) {
      return {
        isOpen: false,
        canPlaceOrder: false,
        errorCode: 'businessRules.storeNotOpenYet',
        currentTime,
        openAt: hours.openAt,
        closeAt: hours.closeAt,
      };
    }

    // After closing
    if (currentTime >= hours.closeAt) {
      const nextOpen = await this.findNextOpenDay(now);
      return {
        isOpen: false,
        canPlaceOrder: false,
        errorCode: 'businessRules.storeClosed',
        currentTime,
        ...nextOpen,
      };
    }

    // Calculate order cutoff time
    const cutoffTime = this.subtractMinutes(hours.closeAt, hours.orderCutoffMinutes);

    // Past order cutoff
    if (currentTime >= cutoffTime) {
      const nextOpen = await this.findNextOpenDay(now);
      return {
        isOpen: true,
        canPlaceOrder: false,
        errorCode: 'businessRules.orderCutoffPassed',
        currentTime,
        openAt: hours.openAt,
        closeAt: hours.closeAt,
        orderCutoffTime: cutoffTime,
        ...nextOpen,
      };
    }

    // Store is open and orders can be placed
    return {
      isOpen: true,
      canPlaceOrder: true,
      currentTime,
      openAt: hours.openAt,
      closeAt: hours.closeAt,
      orderCutoffTime: cutoffTime,
    };
  }

  /**
   * Find the next day when store opens
   */
  private async findNextOpenDay(
    fromDate: Date,
  ): Promise<{ nextOpenDay?: string; nextOpenTime?: string }> {
    const allHours = await this.getAllStoreHours();

    // Check up to 7 days ahead
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(fromDate);
      nextDate.setDate(nextDate.getDate() + i);
      const dayOfWeek = JS_DAY_TO_ENUM[nextDate.getDay()];

      const hours = allHours.find((h) => h.dayOfWeek === dayOfWeek);
      if (hours && !hours.isClosed) {
        return {
          nextOpenDay: dayOfWeek,
          nextOpenTime: hours.openAt,
        };
      }
    }

    return {};
  }

  /**
   * Format Date to HH:MM string
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Subtract minutes from a time string (HH:MM)
   */
  private subtractMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins - minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  /**
   * Invalidate cached store hours (call after admin updates)
   */
  async invalidateCache(): Promise<void> {
    await this.cache.del(`${CACHE_KEYS.SETTINGS}:store_hours`);
    this.logger.log('Store hours cache invalidated');
  }
}
