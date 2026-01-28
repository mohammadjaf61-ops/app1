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
  // System fonts with Arabic support
  sans: 'System', // Maps to SF Pro (iOS) / Roboto (Android)
  // For web, use: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Arabic", sans-serif'
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
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
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
  // Headings
  heading: {
    '2xl': {
      fontSize: fontSize['4xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
    },
    xl: {
      fontSize: fontSize['3xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
    },
    lg: {
      fontSize: fontSize['2xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.semibold,
    },
    md: {
      fontSize: fontSize.xl,
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.semibold,
    },
    sm: {
      fontSize: fontSize.lg,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.semibold,
    },
  },

  // Body text
  body: {
    lg: {
      fontSize: fontSize.lg,
      lineHeight: lineHeight.relaxed,
      fontWeight: fontWeight.normal,
    },
    md: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
    },
    sm: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
    },
    xs: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
    },
  },

  // Labels
  label: {
    lg: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.medium,
    },
    md: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.medium,
    },
    sm: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.medium,
    },
  },

  // Buttons
  button: {
    lg: {
      fontSize: fontSize.lg,
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.semibold,
    },
    md: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.semibold,
    },
    sm: {
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
