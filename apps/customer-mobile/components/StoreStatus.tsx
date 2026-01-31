import { View, Text } from 'react-native';

import { isStoreOpen, getNextOpenTime } from '../lib/store-config';

export function StoreStatus() {
  const open = isStoreOpen();

  if (open) {
    return (
      <View className="flex-row items-center">
        <Text className="text-green-700 font-medium text-sm">مفتوح الآن</Text>
        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
      </View>
    );
  }

  return (
    <View className="flex-row items-center">
      <Text className="text-gray-500 font-medium text-sm">
        مغلق الآن • يفتح {getNextOpenTime()}
      </Text>
      <View className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
    </View>
  );
}
