import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

import { durations, shouldReduceMotion } from '@/lib/motion';

interface ProductCardSkeletonProps {
  variant?: 'default' | 'horizontal';
}

export function ProductCardSkeleton({ variant = 'default' }: ProductCardSkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (shouldReduceMotion()) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: durations.slow * 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: durations.slow * 2,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  if (variant === 'horizontal') {
    return (
      <View className="flex-row bg-white rounded-xl p-3 mb-3">
        <Animated.View
          className="w-20 h-20 bg-gray-200 rounded-lg"
          style={{ opacity: pulseAnim }}
        />
        <View className="flex-1 mr-3 justify-between py-1">
          <Animated.View
            className="h-4 bg-gray-200 rounded w-3/4 self-end"
            style={{ opacity: pulseAnim }}
          />
          <Animated.View
            className="h-4 bg-gray-200 rounded w-1/3 self-end"
            style={{ opacity: pulseAnim }}
          />
        </View>
        <Animated.View
          className="w-10 h-10 bg-gray-200 rounded-full self-center"
          style={{ opacity: pulseAnim }}
        />
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl overflow-hidden w-40">
      <Animated.View
        className="h-32 bg-gray-200"
        style={{ opacity: pulseAnim }}
      />
      <View className="p-3">
        <Animated.View
          className="h-4 bg-gray-200 rounded mb-2"
          style={{ opacity: pulseAnim }}
        />
        <View className="flex-row items-center justify-between">
          <Animated.View
            className="w-8 h-8 bg-gray-200 rounded-full"
            style={{ opacity: pulseAnim }}
          />
          <Animated.View
            className="h-4 bg-gray-200 rounded w-16"
            style={{ opacity: pulseAnim }}
          />
        </View>
      </View>
    </View>
  );
}
