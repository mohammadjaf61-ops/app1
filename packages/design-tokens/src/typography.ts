/**
 * Design Tokens: Typography
 *
 * Font scale follows a modular scale (1.25 ratio)
 * Supports Arabic (RTL) as primary language
 *
 * Usage:
 * - RN: Text style={{ ...typography.heading.lg }}
 * - Web: CSS classes or Tailwind
 */

// Font families
// Note: Arabic fonts should be configured in app entry points
export const fontFamily = {
  heading: 'AlArabiya',
  body: 'DecotypeNaskh',
  ui: 'AlArabiya',
  system: 'System',
  mono: 'monospace',
} as const;

// Font sizes (rem/px equivalents for RN)
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

// Line heights (multipliers)
export const lineHeight = {
  tight: 1.35,
  normal: 1.6,
  relaxed: 1.8,
} as const;

// Font weights
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

// Letter spacing
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
} as const;

// Pre-composed text styles
export const textStyles = {
  heading: {
    h1: {
      fontFamily: fontFamily.heading,
      fontSize: fontSize['3xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.bold,
    },
    h2: {
      fontFamily: fontFamily.heading,
      fontSize: fontSize['2xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.semibold,
    },
    h3: {
      fontFamily: fontFamily.heading,
      fontSize: fontSize.xl,
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.semibold,
    },
  },
  body: {
    md: {
      fontFamily: fontFamily.body,
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
    },
  },
  caption: {
    sm: {
      fontFamily: fontFamily.body,
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
    },
  },
  button: {
    md: {
      fontFamily: fontFamily.ui,
      fontSize: fontSize.base,
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.semibold,
    },
  },
  label: {
    md: {
      fontFamily: fontFamily.ui,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.medium,
    },
  },
} as const;

// Combined export
export const typography = {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  textStyles,
} as const;

export type Typography = typeof typography;
