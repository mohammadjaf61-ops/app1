import { appLogger } from '@hypermarket/mobile-core';
import { ErrorBoundary, ErrorFallback } from '@hypermarket/mobile-ui';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useCallback, type ErrorInfo } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Initialize i18n (must be imported before components)
import './src/lib/i18n';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/auth-store';

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

function AppContent() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <RootNavigator />;
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
