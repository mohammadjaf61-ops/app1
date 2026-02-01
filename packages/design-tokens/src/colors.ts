/**
 * Design Tokens: Colors
 *
 * Primary: Brand colors for main actions and highlights
 * Neutral: Grays for text, backgrounds, borders
 * Status: Semantic colors for feedback (success, error, warning, info)
 *
 * Usage:
 * - RN: StyleSheet.create({ bg: { backgroundColor: colors.primary[500] } })
 * - Web: Tailwind config or CSS variables
 */

// Primary palette - Deep Warm Indigo
export const primary = {
  50: '#F2F3FB',
  100: '#E3E7F6',
  200: '#C6CEF0',
  300: '#A1AEE3',
  400: '#6F80CC',
  500: '#2E3A8C', // Main primary (Light)
  600: '#2A3280',
  700: '#242B72',
  800: '#1F255E', // Dark
  900: '#191E4B',
} as const;

// Neutral palette - Slate (balanced, readable)
export const neutral = {
  0: '#FFFFFF',
  50: '#F9F7F3',
  100: '#F2EFE8',
  200: '#E6E1D8',
  300: '#D2CBBE',
  400: '#A9A091',
  500: '#857C6F',
  600: '#5F594F',
  700: '#47413A',
  800: '#2F2B26',
  900: '#1E1B17',
  1000: '#141110',
} as const;

// Status colors - Semantic feedback
export const status = {
  // Success - Green
  success: {
    light: '#DCFCE7',
    main: '#22C55E',
    dark: '#15803D',
    contrast: '#FFFFFF',
  },
  // Error - Red
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#B91C1C',
    contrast: '#FFFFFF',
  },
  // Warning - Amber
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#B45309',
    contrast: '#FFFFFF',
  },
  // Info - Blue
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1D4ED8',
    contrast: '#FFFFFF',
  },
} as const;

// Background colors
export const background = {
  primary: neutral[50],
  secondary: neutral[100],
  tertiary: neutral[200],
  inverse: '#2A2F55',
} as const;

// Text colors
export const text = {
  primary: primary[800],
  secondary: neutral[600],
  tertiary: neutral[400],
  inverse: neutral[50],
  disabled: neutral[300],
} as const;

// Border colors
export const border = {
  default: neutral[200],
  focus: primary[500],
  error: status.error.main,
  success: status.success.main,
} as const;

// Combined export
export const colors = {
  primary,
  neutral,
  status,
  background,
  text,
  border,
} as const;

export type Colors = typeof colors;
export type PrimaryColor = keyof typeof primary;
export type NeutralColor = keyof typeof neutral;
