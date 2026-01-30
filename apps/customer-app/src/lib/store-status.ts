/**
 * Store Status Utility
 * Determines if store is open based on local time
 * Hardcoded hours for now - can be replaced with API later
 */

// Store hours configuration (Iraq time - UTC+3)
// Format: [openHour, closeHour] in 24h format
const STORE_HOURS: Record<number, [number, number] | null> = {
  0: [9, 22],  // Sunday: 9 AM - 10 PM
  1: [9, 22],  // Monday
  2: [9, 22],  // Tuesday
  3: [9, 22],  // Wednesday
  4: [9, 22],  // Thursday
  5: [10, 20], // Friday: 10 AM - 8 PM (shorter hours)
  6: [9, 22],  // Saturday
};

// Day names in Arabic
const DAY_NAMES_AR: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

export interface StoreStatus {
  isOpen: boolean;
  message: string;
  openHour: number | null;
  closeHour: number | null;
  dayName: string;
}

/**
 * Check if store is currently open
 * @param time - Time to check (defaults to now)
 */
export function isStoreOpen(time: Date = new Date()): StoreStatus {
  const day = time.getDay();
  const hour = time.getHours();
  const dayName = DAY_NAMES_AR[day];
  const hours = STORE_HOURS[day];

  // Store is closed for the day
  if (!hours) {
    return {
      isOpen: false,
      message: `المتجر مغلق يوم ${dayName}`,
      openHour: null,
      closeHour: null,
      dayName,
    };
  }

  const [openHour, closeHour] = hours;

  if (hour >= openHour && hour < closeHour) {
    // Store is open
    const hoursUntilClose = closeHour - hour;
    const closeMessage = hoursUntilClose <= 1 ? 'يغلق قريبًا' : '';

    return {
      isOpen: true,
      message: closeMessage || `مفتوح حتى ${formatHour(closeHour)}`,
      openHour,
      closeHour,
      dayName,
    };
  }

  // Store is closed
  if (hour < openHour) {
    // Before opening
    return {
      isOpen: false,
      message: `يفتح الساعة ${formatHour(openHour)}`,
      openHour,
      closeHour,
      dayName,
    };
  }

  // After closing
  return {
    isOpen: false,
    message: `مغلق — يفتح غدًا ${formatHour(getNextDayOpenHour(day))}`,
    openHour,
    closeHour,
    dayName,
  };
}

/**
 * Get next opening time
 * @param fromTime - Starting time (defaults to now)
 */
export function getNextOpenTime(fromTime: Date = new Date()): Date | null {
  const status = isStoreOpen(fromTime);

  if (status.isOpen) {
    return fromTime; // Already open
  }

  const currentHour = fromTime.getHours();
  const currentDay = fromTime.getDay();
  const todayHours = STORE_HOURS[currentDay];

  // Check if store opens later today
  if (todayHours && currentHour < todayHours[0]) {
    const nextOpen = new Date(fromTime);
    nextOpen.setHours(todayHours[0], 0, 0, 0);
    return nextOpen;
  }

  // Find next day that has hours
  for (let i = 1; i <= 7; i++) {
    const nextDay = (currentDay + i) % 7;
    const nextHours = STORE_HOURS[nextDay];

    if (nextHours) {
      const nextOpen = new Date(fromTime);
      nextOpen.setDate(nextOpen.getDate() + i);
      nextOpen.setHours(nextHours[0], 0, 0, 0);
      return nextOpen;
    }
  }

  return null;
}

/**
 * Get store hours for display
 */
export function getStoreHoursText(day?: number): string {
  const targetDay = day ?? new Date().getDay();
  const hours = STORE_HOURS[targetDay];

  if (!hours) {
    return 'مغلق';
  }

  return `${formatHour(hours[0])} - ${formatHour(hours[1])}`;
}

/**
 * Get opening hour for next day
 */
function getNextDayOpenHour(currentDay: number): number {
  const nextDay = (currentDay + 1) % 7;
  const hours = STORE_HOURS[nextDay];
  return hours ? hours[0] : 9; // Default to 9 AM
}

/**
 * Format hour in Arabic (12h format)
 */
function formatHour(hour: number): string {
  const period = hour >= 12 ? 'مساءً' : 'صباحًا';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

/**
 * Get store status badge info for UI
 */
export function getStoreStatusBadge(): {
  text: string;
  color: 'green' | 'amber' | 'red';
  isOpen: boolean;
} {
  const status = isStoreOpen();

  if (status.isOpen) {
    // Check if closing soon (within 1 hour)
    const now = new Date();
    if (status.closeHour && now.getHours() >= status.closeHour - 1) {
      return {
        text: 'يغلق قريبًا',
        color: 'amber',
        isOpen: true,
      };
    }

    return {
      text: 'مفتوح الآن',
      color: 'green',
      isOpen: true,
    };
  }

  return {
    text: 'مغلق',
    color: 'red',
    isOpen: false,
  };
}
