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

// Primary palette - Blue (professional, trustworthy)
export const primary = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6', // Main primary
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
} as const;

// Neutral palette - Slate (balanced, readable)
export const neutral = {
  0: '#FFFFFF',
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
  1000: '#020617',
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
    contrast: '#000000',
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
  primary: neutral[0],
  secondary: neutral[50],
  tertiary: neutral[100],
  inverse: neutral[900],
} as const;

// Text colors
export const text = {
  primary: neutral[900],
  secondary: neutral[600],
  tertiary: neutral[400],
  inverse: neutral[0],
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
