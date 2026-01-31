import { appLogger } from '@hypermarket/mobile-core';
import { ErrorBoundary, ErrorFallback } from '@hypermarket/mobile-ui';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useRef, useCallback, type ErrorInfo } from 'react';
import type { AppStateStatus } from 'react-native';
import { I18nManager, LogBox, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from '@/lib/database';
import { checkAndSync } from '@/lib/sync';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAuthStore } from '@/stores/auth-store';

// Force RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Ignore specific warnings in development
LogBox.ignoreLogs(['NativeWind']);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 1000, // 30 seconds - fresher data for picker
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { initialize } = useAuthStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize auth state from SecureStore
    initialize();
    // Initialize SQLite database for offline support
    initDatabase();

    // Listen for app state changes to sync when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - check connectivity and sync
        checkAndSync();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [initialize]);

  return <RootNavigator />;
}

export default function App() {
  const handleError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    appLogger.error('Unhandled app error', error, {
      scope: 'PickerApp',
      metadata: { componentStack: errorInfo.componentStack },
    });
  }, []);

  const handleReset = useCallback(() => {
    // Reset query cache on error recovery
    queryClient.clear();
  }, []);

  return (
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
  );
}
