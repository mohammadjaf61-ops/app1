/**
 * Design Tokens: Animation
 *
 * Minimal, purposeful animations for micro-interactions
 * Focus on perceived performance, not decoration
 *
 * Usage:
 * - RN: Animated API with these durations/easings
 * - Web: CSS transitions or Framer Motion
 */

// Duration scale (milliseconds)
export const duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

// Easing curves (CSS/RN compatible strings)
export const easing = {
  // Standard easings
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom curves for specific uses
  // These are cubic-bezier values
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bounce effect
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material standard
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)', // Enter screen
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)', // Exit screen
} as const;

// Pre-composed animation configs
export const animations = {
  // Button press feedback
  press: {
    scale: 0.98,
    duration: duration.fast,
    easing: easing.easeOut,
  },

  // Add to cart pulse
  addToCart: {
    scale: [1, 1.05, 1],
    duration: duration.normal,
    easing: easing.spring,
  },

  // Screen transitions
  screenEnter: {
    opacity: { from: 0, to: 1 },
    translateX: { from: 20, to: 0 }, // RTL: positive = from left
    duration: duration.normal,
    easing: easing.decelerate,
  },
  screenExit: {
    opacity: { from: 1, to: 0 },
    translateX: { from: 0, to: -20 },
    duration: duration.fast,
    easing: easing.accelerate,
  },

  // Fade
  fadeIn: {
    opacity: { from: 0, to: 1 },
    duration: duration.normal,
    easing: easing.easeOut,
  },
  fadeOut: {
    opacity: { from: 1, to: 0 },
    duration: duration.fast,
    easing: easing.easeIn,
  },

  // Skeleton shimmer
  skeleton: {
    duration: 1500,
    easing: easing.linear,
  },
} as const;

// Combined export
export const animation = {
  duration,
  easing,
  animations,
} as const;

export type Animation = typeof animation;
