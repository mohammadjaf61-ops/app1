import React, { useRef, useCallback } from 'react';
import type { StyleProp, ViewStyle, PressableProps } from 'react-native';
import { Pressable, Animated, Platform } from 'react-native';

// Haptic feedback (if available)
let Haptics: { impactAsync?: (style: string) => void } | null = null;
try {
  // Optional dependency - will be undefined if not installed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics');
} catch {
  // Haptics not available
}

export interface AnimatedPressableProps extends PressableProps {
  /** Children to render */
  children: React.ReactNode;
  /** Scale value when pressed (0.95-1.0) */
  pressScale?: number;
  /** Enable haptic feedback on press */
  haptic?: boolean;
  /** Style for the container */
  style?: StyleProp<ViewStyle>;
}

/**
 * Pressable with subtle scale animation and optional haptic feedback
 *
 * Micro-interaction #1: Button/Touch feedback
 *
 * Usage:
 * ```tsx
 * <AnimatedPressable onPress={handlePress}>
 *   <Text>Tap me</Text>
 * </AnimatedPressable>
 * ```
 */
export function AnimatedPressable({
  children,
  pressScale = 0.98,
  haptic = true,
  style,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      // Animate scale down
      Animated.spring(scaleValue, {
        toValue: pressScale,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();

      // Haptic feedback (light)
      if (haptic && Platform.OS !== 'web' && Haptics?.impactAsync) {
        Haptics.impactAsync('light');
      }

      onPressIn?.(event);
    },
    [scaleValue, pressScale, haptic, onPressIn],
  );

  const handlePressOut = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      // Animate scale back
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 6,
      }).start();

      onPressOut?.(event);
    },
    [scaleValue, onPressOut],
  );

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...props}>
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
