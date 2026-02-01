import { colors } from '@hypermarket/design-tokens';
import React, { useCallback, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from './AnimatedPressable';

// Haptic feedback (if available)
let Haptics: { notificationAsync?: (type: string) => void } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics');
} catch {
  // Haptics not available
}

export interface AddToCartButtonProps {
  /** Button label */
  label?: string;
  /** Called when button is pressed */
  onPress: () => void | Promise<void>;
  /** Price to display */
  price?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether an operation is loading */
  loading?: boolean;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Add to Cart button with micro-interaction
 *
 * Micro-interaction #1: Add-to-Cart feedback
 * - Scale pulse (1 → 1.05 → 1)
 * - Success haptic feedback
 * - Color flash on success
 *
 * Usage:
 * ```tsx
 * <AddToCartButton
 *   label="أضف للسلة"
 *   price="5,000 د.ع"
 *   onPress={handleAddToCart}
 * />
 * ```
 */
export function AddToCartButton({
  label = 'أضف للسلة',
  onPress,
  price,
  disabled = false,
  loading = false,
  style,
}: AddToCartButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePress = useCallback(async () => {
    if (disabled || loading) {
      return;
    }

    // Trigger success animation
    Animated.sequence([
      Animated.spring(scaleValue, {
        toValue: 1.05,
        useNativeDriver: true,
        speed: 40,
        bounciness: 12,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 8,
      }),
    ]).start();

    // Show success state briefly
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 600);

    // Success haptic
    if (Platform.OS !== 'web' && Haptics?.notificationAsync) {
      Haptics.notificationAsync('success');
    }

    // Execute callback
    await onPress();
  }, [disabled, loading, scaleValue, onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      haptic={false} // We handle haptic ourselves
      style={[styles.wrapper, style]}
    >
      <Animated.View
        style={[
          styles.button,
          isSuccess && styles.buttonSuccess,
          (disabled || loading) && styles.buttonDisabled,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <View style={styles.content}>
          {price && <Text style={styles.price}>{price}</Text>}
          <Text style={[styles.label, isSuccess && styles.labelSuccess]}>
            {isSuccess ? '✓ تمت الإضافة' : label}
          </Text>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonSuccess: {
    backgroundColor: colors.status.success.main,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    color: colors.neutral[0],
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelSuccess: {
    color: colors.neutral[0],
  },
  price: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
});
