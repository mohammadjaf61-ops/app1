/**
 * OfflineBanner Component
 *
 * Displays a minimal banner when the device is offline.
 * Shows cached data notification. Non-blocking, non-flashy.
 */

import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@hypermarket/mobile-core';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

interface OfflineBannerProps {
  /** Show cached data message */
  showCacheMessage?: boolean;
  /** Callback when retry is pressed */
  onRetry?: () => void;
}

export function OfflineBanner({ showCacheMessage = true }: OfflineBannerProps) {
  const { isOffline, isOnline } = useNetworkStatus();
  const [showConnected, setShowConnected] = useState(false);
  const wasOffline = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Track offline->online transitions
  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
    } else if (wasOffline.current && isOnline) {
      // Just came back online
      wasOffline.current = false;
      setShowConnected(true);

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 2 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowConnected(false);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, isOnline, fadeAnim]);

  // Show "connected" toast
  if (showConnected) {
    return (
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="bg-green-500 px-4 py-2"
      >
        <View className="flex-row items-center justify-center">
          <Text className="text-white font-medium mr-2">تم الاتصال</Text>
          <Ionicons name="checkmark-circle" size={18} color="white" />
        </View>
      </Animated.View>
    );
  }

  if (!isOffline) {
    return null;
  }

  return (
    <View className="bg-gray-600 px-4 py-2">
      <View className="flex-row items-center justify-center">
        {showCacheMessage && (
          <Text className="text-white/80 text-sm mr-2">— التصفح متاح</Text>
        )}
        <Text className="text-white font-medium mr-2">أنت غير متصل</Text>
        <Ionicons name="cloud-offline-outline" size={18} color="white" />
      </View>
    </View>
  );
}

/**
 * Compact offline indicator for inline use
 */
export function OfflineIndicator() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <View className="flex-row items-center bg-amber-100 px-2 py-1 rounded-full">
      <Text className="text-amber-700 text-xs mr-1">غير متصل</Text>
      <Ionicons name="cloud-offline-outline" size={12} color="#b45309" />
    </View>
  );
}
