import { View } from 'react-native';

export function ProductCardSkeleton() {
  return (
    <View className="w-[48%] bg-white rounded-xl p-3 mb-3 border border-gray-100">
      <View className="h-24 bg-gray-200 rounded-lg mb-2 animate-pulse" />
      <View className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
      <View className="flex-row items-center justify-between mt-2">
        <View className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <View className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
      </View>
    </View>
  );
}
