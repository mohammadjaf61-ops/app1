/**
 * Motion Primitives
 * Single source for all animation values
 */

import { Easing, type EasingFunction } from 'react-native';
import { AccessibilityInfo } from 'react-native';

// Durations (ms)
export const durations = {
  fast: 120,
  normal: 200,
  slow: 300,
} as const;

// Easing curves
export const easings = {
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  emphasized: Easing.bezier(0.2, 0, 0, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
} as const;

// Scale values
export const scales = {
  pressed: 0.98,
  normal: 1,
  bounce: 1.02,
} as const;

// Opacity values
export const opacities = {
  pressed: 0.9,
  normal: 1,
  dimmed: 0.6,
} as const;

// Translate values (px)
export const translates = {
  bump: -3,
  slideIn: 20,
} as const;

// Reduce motion preference
let reduceMotionEnabled = false;

export function initMotionPreference(): void {
  AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
    reduceMotionEnabled = enabled;
  });

  AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
    reduceMotionEnabled = enabled;
  });
}

export function shouldReduceMotion(): boolean {
  return reduceMotionEnabled;
}

// Animation config helper
export function getAnimationConfig(duration: keyof typeof durations, easing: EasingFunction = easings.standard) {
  if (reduceMotionEnabled) {
    return { duration: 0, useNativeDriver: true };
  }
  return {
    duration: durations[duration],
    easing,
    useNativeDriver: true,
  };
}
