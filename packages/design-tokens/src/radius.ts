/**
 * Design Tokens: Border Radius
 *
 * Consistent corner rounding across the platform
 *
 * Usage:
 * - RN: borderRadius: radius.md
 * - Web: Tailwind or CSS variables
 */

// Border radius scale
export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999, // Pill/circle
} as const;

// Semantic radius aliases
export const borderRadius = {
  // Components
  button: radius.md, // 8px
  buttonSm: radius.sm, // 4px
  buttonLg: radius.lg, // 12px

  input: radius.md, // 8px
  card: radius.lg, // 12px
  badge: radius.full, // Pill

  // Containers
  modal: radius.xl, // 16px
  sheet: radius['2xl'], // 24px (bottom sheet top corners)
  tooltip: radius.sm, // 4px

  // Media
  avatar: radius.full, // Circle
  image: radius.md, // 8px
  thumbnail: radius.sm, // 4px
} as const;

export type Radius = typeof radius;
export type RadiusKey = keyof typeof radius;
