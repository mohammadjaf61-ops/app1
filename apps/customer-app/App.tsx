import { appLogger } from '@hypermarket/mobile-core';
import { ErrorBoundary, ErrorFallback } from '@hypermarket/mobile-ui';
import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useCallback, type ErrorInfo } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import './src/lib/i18n';

import { useAppFonts } from './src/lib/fonts';
import { initNetworkMonitoring } from './src/lib/network';
import { queryClient, persistOptions } from './src/lib/query-client';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/auth-store';
import { initSyncQueue } from './src/stores/sync-queue';

// Keep splash visible until fonts loaded
SplashScreen.preventAutoHideAsync();

// Initialize network monitoring and sync queue early
initNetworkMonitoring();
initSyncQueue();

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

function AppContent() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <RootNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const handleError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    appLogger.error('Unhandled app error', error, {
      scope: 'CustomerApp',
      metadata: { componentStack: errorInfo.componentStack },
    });
  }, []);

  const handleReset = useCallback(() => {
    queryClient.clear();
  }, []);

  // Keep splash visible until fonts ready
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutReady}>
      <SafeAreaProvider>
        <ErrorBoundary
          onError={handleError}
          onReset={handleReset}
          fallback={({ error, resetError }) => (
            <ErrorFallback error={error} resetError={resetError} showError={__DEV__} />
          )}
        >
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
          >
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </PersistQueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
