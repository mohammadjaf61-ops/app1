import { colors } from '@hypermarket/design-tokens';
import React, { useEffect, useRef } from 'react';
import type { ViewStyle, DimensionValue } from 'react-native';
import { View, Animated, StyleSheet } from 'react-native';

export interface SkeletonProps {
  /** Width of the skeleton */
  width?: DimensionValue;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Additional style */
  style?: ViewStyle;
  /** Make it a circle */
  circle?: boolean;
}

/**
 * Skeleton loading placeholder with shimmer animation
 *
 * Usage:
 * ```tsx
 * <Skeleton width={200} height={20} />
 * <Skeleton circle width={48} height={48} />
 * ```
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  circle = false,
}: SkeletonProps) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const size = circle ? { width: height, height, borderRadius: height / 2 } : {};

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: circle ? height : width,
          height,
          borderRadius: circle ? height / 2 : borderRadius,
          opacity,
        },
        size,
        style,
      ]}
    />
  );
}

/**
 * Pre-composed skeleton layouts for common use cases
 */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width={80} height={80} borderRadius={12} />
      <View style={styles.cardContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
        <Skeleton width="30%" height={20} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <Skeleton circle height={48} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonProductGrid() {
  return (
    <View style={styles.productGrid}>
      {[0, 1].map((row) => (
        <View key={row} style={styles.productRow}>
          {[0, 1].map((col) => (
            <View key={col} style={styles.productItem}>
              <Skeleton height={120} borderRadius={12} />
              <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
              <Skeleton width="50%" height={16} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.neutral[200],
  },
  card: {
    flexDirection: 'row-reverse', // RTL
    padding: 16,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    alignItems: 'flex-end', // RTL
  },
  listItem: {
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
    alignItems: 'flex-end', // RTL
  },
  productGrid: {
    padding: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productItem: {
    width: '48%',
    padding: 8,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
  },
});
