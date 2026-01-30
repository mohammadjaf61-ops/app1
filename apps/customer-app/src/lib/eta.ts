/**
 * ETA (Estimated Time of Arrival) Calculator
 * Client-side estimation based on store status and order time
 */

import { isStoreOpen, getNextOpenTime, type StoreStatus } from './store-status';

export interface ETAResult {
  /** Estimated delivery time range in minutes */
  minMinutes: number;
  maxMinutes: number;
  /** Human-readable Arabic message */
  message: string;
  /** Whether order will be processed immediately */
  isImmediate: boolean;
  /** Store status at order time */
  storeStatus: StoreStatus;
}

// Base delivery times (in minutes)
const BASE_PREP_TIME = 15; // Order preparation
const BASE_DELIVERY_TIME = 30; // Average delivery
const TIME_BUFFER = 15; // Safety buffer

/**
 * Calculate estimated delivery time
 * @param orderTime - Time of order (defaults to now)
 */
export function calculateETA(orderTime: Date = new Date()): ETAResult {
  const storeStatus = isStoreOpen(orderTime);

  if (storeStatus.isOpen) {
    // Store is open - immediate processing
    const minMinutes = BASE_PREP_TIME + BASE_DELIVERY_TIME;
    const maxMinutes = minMinutes + TIME_BUFFER;

    return {
      minMinutes,
      maxMinutes,
      message: `التوصيل خلال ${minMinutes}–${maxMinutes} دقيقة`,
      isImmediate: true,
      storeStatus,
    };
  }

  // Store is closed
  const nextOpen = getNextOpenTime(orderTime);

  if (nextOpen) {
    const minutesUntilOpen = Math.ceil((nextOpen.getTime() - orderTime.getTime()) / (1000 * 60));
    const minMinutes = minutesUntilOpen + BASE_PREP_TIME + BASE_DELIVERY_TIME;
    const maxMinutes = minMinutes + TIME_BUFFER;

    // Format next open time
    const hours = nextOpen.getHours();
    const period = hours >= 12 ? 'مساءً' : 'صباحًا';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

    return {
      minMinutes,
      maxMinutes,
      message: `سيُحضَّر الطلب عند فتح المتجر (${displayHour}:00 ${period})`,
      isImmediate: false,
      storeStatus,
    };
  }

  // Fallback (shouldn't happen normally)
  return {
    minMinutes: 60,
    maxMinutes: 90,
    message: 'سيُحضَّر الطلب عند فتح المتجر',
    isImmediate: false,
    storeStatus,
  };
}

/**
 * Get simple ETA message for display
 */
export function getETAMessage(orderTime?: Date): string {
  return calculateETA(orderTime).message;
}

/**
 * Get ETA range as string (e.g., "45-60 دقيقة")
 */
export function getETARange(orderTime?: Date): string {
  const eta = calculateETA(orderTime);
  if (eta.isImmediate) {
    return `${eta.minMinutes}–${eta.maxMinutes} دقيقة`;
  }
  return 'عند فتح المتجر';
}
