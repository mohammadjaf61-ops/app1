export const STORE_CONFIG = {
  // Opening hours (24h format, Iraq timezone)
  openingHour: 8, // 8 AM
  closingHour: 23, // 11 PM

  // Delivery ETA in minutes
  etaMinMinutes: 35,
  etaMaxMinutes: 55,

  // Store name
  nameAr: 'الهايبرماركت',
};

export function isStoreOpen(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= STORE_CONFIG.openingHour && hour < STORE_CONFIG.closingHour;
}

export function getNextOpenTime(): string {
  const now = new Date();
  const hour = now.getHours();

  if (hour < STORE_CONFIG.openingHour) {
    return `${STORE_CONFIG.openingHour}:00 صباحاً`;
  }
  // Store closed for today, opens tomorrow
  return `${STORE_CONFIG.openingHour}:00 صباحاً غداً`;
}

export function getDeliveryEta(): { min: number; max: number; text: string } {
  return {
    min: STORE_CONFIG.etaMinMinutes,
    max: STORE_CONFIG.etaMaxMinutes,
    text: `${STORE_CONFIG.etaMinMinutes}–${STORE_CONFIG.etaMaxMinutes} دقيقة`,
  };
}
