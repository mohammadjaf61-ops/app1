import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text } from 'react-native';

import { useDeliveryStore } from '@/stores/delivery-store';

export function OfflineBanner() {
  const { isOffline } = useDeliveryStore();

  if (!isOffline) {
    return null;
  }

  return (
    <View className="bg-amber-500 px-4 py-2 flex-row items-center justify-center">
      <Text className="text-white font-medium mr-2">وضع بدون اتصال</Text>
      <Ionicons name="cloud-offline-outline" size={18} color="white" />
    </View>
  );
}
