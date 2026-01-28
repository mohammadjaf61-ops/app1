/**
 * Design Tokens: Shadows
 *
 * Elevation system for depth and hierarchy
 *
 * Usage:
 * - RN: Use shadow* properties
 * - Web: box-shadow CSS
 */

// Shadow definitions (RN format)
// Note: RN uses shadowColor, shadowOffset, shadowOpacity, shadowRadius
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0, // Android
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// CSS box-shadow equivalents (for web)
export const boxShadow = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
  lg: '0 4px 8px 0 rgba(0, 0, 0, 0.15)',
  xl: '0 8px 16px 0 rgba(0, 0, 0, 0.2)',
} as const;

export type Shadows = typeof shadows;
export type ShadowKey = keyof typeof shadows;
