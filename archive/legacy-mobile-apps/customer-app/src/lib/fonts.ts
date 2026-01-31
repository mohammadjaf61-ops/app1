import { useFonts } from 'expo-font';

export const fontAssets = {
  'DecotypeNaskh': require('../../../assets/fonts/decotype-naskh-special.ttf'),
  'AlArabiya': require('../../../assets/fonts/ae_AlArabiya.ttf'),
};

export function useAppFonts() {
  return useFonts(fontAssets);
}

export const fonts = {
  arabic: 'DecotypeNaskh',
  arabicAlt: 'AlArabiya',
} as const;
