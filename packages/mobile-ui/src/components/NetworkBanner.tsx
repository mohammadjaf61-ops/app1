import { View, Text } from 'react-native';

interface NetworkBannerProps {
  isOnline: boolean;
  isSyncing?: boolean;
}

export function NetworkBanner({ isOnline, isSyncing = false }: NetworkBannerProps) {
  if (!isOnline) {
    return (
      <View
        className="absolute top-0 left-0 right-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2"
        pointerEvents="none"
      >
        <Text className="text-amber-800 text-sm text-right">أنت غير متصل بالإنترنت</Text>
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View
        className="absolute top-0 left-0 right-0 z-50 border-b border-blue-200 bg-blue-50 px-4 py-2"
        pointerEvents="none"
      >
        <Text className="text-blue-800 text-sm text-right">جاري مزامنة الطلبات...</Text>
      </View>
    );
  }

  return null;
}
