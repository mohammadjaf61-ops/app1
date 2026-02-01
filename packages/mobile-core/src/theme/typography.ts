/**
 * Typography System - Hypermarket Platform
 * Provides consistent text styling across all mobile apps
 */

export const fontFamilies = {
  heading: 'AlArabiya',
  body: 'DecotypeNaskh',
  ui: 'AlArabiya',
  system: 'System',
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const lineHeights = {
  tight: 1.35,
  normal: 1.6,
  relaxed: 1.8,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
} as const;

export const typography = {
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  },
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  },
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },
  h4: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.lg * lineHeights.tight,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  button: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.base * lineHeights.tight,
  },
  label: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.tight,
  },
} as const;

export type FontFamily = keyof typeof fontFamilies;
export type FontWeight = keyof typeof fontWeights;
export type FontSize = keyof typeof fontSizes;
export type TypographyVariant = keyof typeof typography;
