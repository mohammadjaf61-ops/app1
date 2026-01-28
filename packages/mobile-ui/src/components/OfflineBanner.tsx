import { View, Text, TouchableOpacity } from 'react-native';

export interface OfflineBannerProps {
  /** Message to display when offline */
  message?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Callback when retry is pressed */
  onRetry?: () => void;
  /** Retry button label */
  retryLabel?: string;
}

/**
 * Banner shown when the app is offline.
 * Displays a warning message and optional retry button.
 */
export function OfflineBanner({
  message = 'لا يوجد اتصال — عرض بيانات محفوظة',
  showRetry = true,
  onRetry,
  retryLabel = 'إعادة المحاولة',
}: OfflineBannerProps) {
  return (
    <View className="flex-row items-center justify-between bg-amber-500 px-4 py-3">
      <View className="flex-1 flex-row items-center">
        <Text className="ml-2 text-lg">📡</Text>
        <Text className="flex-1 text-sm font-medium text-white">{message}</Text>
      </View>

      {showRetry && onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="rounded-lg bg-white/20 px-3 py-1.5"
          activeOpacity={0.7}
        >
          <Text className="text-sm font-bold text-white">{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
