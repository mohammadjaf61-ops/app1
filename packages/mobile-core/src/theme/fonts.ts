/**
 * Font Loading Utilities
 * Provides font assets and loading helpers for Expo apps
 */

import { fontFamilies } from './typography';

/**
 * Font asset map for expo-font
 * Usage: useFonts(fontAssets)
 */
export const fontAssets = {
  [fontFamilies.primary]: require('@hypermarket/mobile-ui/assets/fonts/decotype-naskh-special.ttf'),
  [fontFamilies.secondary]: require('@hypermarket/mobile-ui/assets/fonts/ae_AlArabiya.ttf'),
} as const;

/**
 * Font family names for stylesheet usage
 */
export const fonts = {
  arabic: fontFamilies.primary,
  arabicSecondary: fontFamilies.secondary,
  default: fontFamilies.primary,
} as const;

/**
 * Get font family with fallback
 */
export function getFontFamily(variant: keyof typeof fonts = 'default'): string {
  return fonts[variant];
}
