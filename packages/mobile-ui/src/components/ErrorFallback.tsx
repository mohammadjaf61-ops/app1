import { View, Text, TouchableOpacity } from 'react-native';

import type { ErrorFallbackProps } from './ErrorBoundary';

export interface ErrorFallbackScreenProps extends ErrorFallbackProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  showError?: boolean;
}

/**
 * Default error fallback screen for mobile apps.
 * Displays a user-friendly error message with retry option.
 *
 * - Does NOT show technical error details to end users
 * - Provides clear retry action
 * - RTL-ready with Arabic as default
 */
export function ErrorFallback({
  resetError,
  title = 'حدث خطأ غير متوقع',
  message = 'نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.',
  retryLabel = 'إعادة المحاولة',
  showError = false,
  error,
}: ErrorFallbackScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {/* Error Icon */}
      <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <Text className="text-4xl">⚠️</Text>
      </View>

      {/* Title */}
      <Text className="mb-2 text-center text-xl font-bold text-gray-900">{title}</Text>

      {/* Message */}
      <Text className="mb-8 text-center text-base text-gray-600">{message}</Text>

      {/* Show error details only in development */}
      {showError && __DEV__ && (
        <View className="mb-6 w-full rounded-lg bg-gray-100 p-4">
          <Text className="text-xs text-gray-500">{error.message}</Text>
        </View>
      )}

      {/* Retry Button */}
      <TouchableOpacity
        onPress={resetError}
        className="min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-6 py-3"
        activeOpacity={0.7}
      >
        <Text className="text-center text-base font-bold text-white">{retryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
