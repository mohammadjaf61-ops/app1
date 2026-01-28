/**
 * OfflineBanner Component
 *
 * Displays a banner when the device is offline.
 * Shows cached data notification and retry button.
 */

import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@hypermarket/mobile-core';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface OfflineBannerProps {
  /** Show cached data message */
  showCacheMessage?: boolean;
  /** Callback when retry is pressed */
  onRetry?: () => void;
}

export function OfflineBanner({ showCacheMessage = true, onRetry }: OfflineBannerProps) {
  const { isOffline, refresh } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await refresh();
    onRetry?.();
    setIsRetrying(false);
  };

  if (!isOffline) {
    return null;
  }

  return (
    <View className="bg-amber-500 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={handleRetry}
          disabled={isRetrying}
          className="flex-row items-center bg-amber-600/50 px-3 py-1.5 rounded-full"
          activeOpacity={0.7}
        >
          <Text className="text-white text-sm font-medium mr-1">
            {isRetrying ? 'جارٍ المحاولة...' : 'إعادة المحاولة'}
          </Text>
          <Ionicons name={isRetrying ? 'sync' : 'refresh-outline'} size={16} color="white" />
        </TouchableOpacity>

        <View className="flex-row items-center flex-1 justify-end">
          {showCacheMessage && (
            <Text className="text-white/90 text-sm mr-2">عرض بيانات محفوظة</Text>
          )}
          <Text className="text-white font-medium mr-2">لا يوجد اتصال</Text>
          <Ionicons name="cloud-offline-outline" size={20} color="white" />
        </View>
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
