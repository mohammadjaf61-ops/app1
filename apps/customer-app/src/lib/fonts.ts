/**
 * Font Loader
 * Loads Arabic fonts using expo-font
 */

import { useFonts } from 'expo-font';

export const fontAssets = {
  'DecotypeNaskh': require('../../../assets/fonts/decotype-naskh-special.ttf'),
  'AlArabiya': require('../../../assets/fonts/ae_AlArabiya.ttf'),
};

/**
 * Hook to load app fonts
 * Returns [fontsLoaded, fontError]
 */
export function useAppFonts() {
  return useFonts(fontAssets);
}

/**
 * Font family names for use in styles
 */
export const fonts = {
  arabic: 'DecotypeNaskh',
  arabicAlt: 'AlArabiya',
} as const;
