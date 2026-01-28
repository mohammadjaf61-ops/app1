import React, { useEffect, useCallback, type ErrorInfo } from 'react';
import { I18nManager, LogBox, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary, ErrorFallback, OfflineBanner } from '@hypermarket/mobile-ui';
import { appLogger, networkService, useNetworkStatus } from '@hypermarket/mobile-core';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/auth-store';

// Force RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Ignore specific warnings in development
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize network service
networkService.initialize();

/**
 * Offline-aware banner that shows when network is unavailable.
 */
function NetworkStatusBanner() {
  const { isOffline, refresh } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: '#f59e0b' }}>
      <OfflineBanner onRetry={refresh} />
    </View>
  );
}

function AppContent() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <NetworkStatusBanner />
      <RootNavigator />
    </>
  );
}

export default function App() {
  const handleError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    appLogger.error('Unhandled app error', error, {
      scope: 'CustomerApp',
      metadata: { componentStack: errorInfo.componentStack },
    });
  }, []);

  const handleReset = useCallback(() => {
    // Reset query cache on error recovery
    queryClient.clear();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary
          onError={handleError}
          onReset={handleReset}
          fallback={({ error, resetError }) => (
            <ErrorFallback error={error} resetError={resetError} showError={__DEV__} />
          )}
        >
          <QueryClientProvider client={queryClient}>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
