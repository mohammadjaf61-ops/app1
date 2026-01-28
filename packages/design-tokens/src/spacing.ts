/**
 * Design Tokens: Spacing
 *
 * Based on 4px grid system for consistent layouts
 * Values: 4, 8, 12, 16, 24, 32, 48, 64, 96
 *
 * Usage:
 * - RN: marginVertical: spacing[4]
 * - Web: Tailwind or CSS variables
 */

// Base spacing scale (in pixels)
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Semantic spacing aliases
export const space = {
  // Component internal spacing
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[3], // 12px
  lg: spacing[4], // 16px
  xl: spacing[6], // 24px
  '2xl': spacing[8], // 32px
  '3xl': spacing[12], // 48px

  // Layout spacing
  gutter: spacing[4], // 16px - Standard gutter
  section: spacing[8], // 32px - Section spacing
  page: spacing[6], // 24px - Page padding

  // Touch targets (minimum 44px for accessibility)
  touchTarget: 44,
  touchTargetLg: 48,
} as const;

// Gap utilities for flex/grid
export const gap = {
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[4], // 16px
  lg: spacing[6], // 24px
  xl: spacing[8], // 32px
} as const;

// Insets (padding patterns)
export const insets = {
  none: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  xs: {
    top: spacing[1],
    right: spacing[1],
    bottom: spacing[1],
    left: spacing[1],
  },
  sm: {
    top: spacing[2],
    right: spacing[2],
    bottom: spacing[2],
    left: spacing[2],
  },
  md: {
    top: spacing[4],
    right: spacing[4],
    bottom: spacing[4],
    left: spacing[4],
  },
  lg: {
    top: spacing[6],
    right: spacing[6],
    bottom: spacing[6],
    left: spacing[6],
  },
  // Asymmetric for cards
  card: {
    top: spacing[4],
    right: spacing[4],
    bottom: spacing[4],
    left: spacing[4],
  },
  // Page-level
  page: {
    top: spacing[4],
    right: spacing[6],
    bottom: spacing[4],
    left: spacing[6],
  },
} as const;

export type Spacing = typeof spacing;
export type SpaceKey = keyof typeof space;
