/**
 * @hypermarket/design-tokens
 *
 * Unified design system tokens for the Hypermarket platform
 * Shared between React Native mobile apps and Next.js web apps
 *
 * @example
 * ```typescript
 * import { colors, spacing, typography, radius } from '@hypermarket/design-tokens';
 *
 * const styles = StyleSheet.create({
 *   button: {
 *     backgroundColor: colors.primary[500],
 *     padding: spacing[4],
 *     borderRadius: radius.md,
 *     ...typography.textStyles.button.md,
 *   },
 * });
 * ```
 */

// Core tokens
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './animation';
export * from './shadows';

// Re-export for convenience
import { colors } from './colors';
import { typography } from './typography';
import { spacing, space, gap, insets } from './spacing';
import { radius, borderRadius } from './radius';
import { animation, duration, easing, animations } from './animation';
import { shadows, boxShadow } from './shadows';

export const tokens = {
  colors,
  typography,
  spacing,
  space,
  gap,
  insets,
  radius,
  borderRadius,
  animation,
  duration,
  easing,
  animations,
  shadows,
  boxShadow,
} as const;

export default tokens;
