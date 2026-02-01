import {
  useCartSyncProcessor,
  useNetworkStatus,
  useOrderQueueProcessor,
  useOrderQueueStore,
} from '@hypermarket/mobile-core';
import { NetworkBanner } from '@hypermarket/mobile-ui';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager, InteractionManager } from 'react-native';

import { ToastProvider } from '../components/Toast';
import { API_BASE_URL } from '../lib/constants';
import { markTTI } from '../lib/performance';
import { queryClient, persistOptions } from '../lib/query-client';

function OrderQueueProcessor() {
  useOrderQueueProcessor({ baseUrl: API_BASE_URL });
  return null;
}

function CartSyncProcessor() {
  useCartSyncProcessor({ baseUrl: API_BASE_URL });
  return null;
}

SplashScreen.preventAutoHideAsync();

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const [, fontError] = useFonts({
    // Custom Arabic fonts - place .ttf files in assets/fonts/
    DecotypeNaskh: require('../assets/fonts/decotype-naskh-special.ttf'),
    AlArabiya: require('../assets/fonts/ae_AlArabiya.ttf'),
  });

  useEffect(() => {
    // Force RTL if not already set
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    }
  }, []);

  useEffect(() => {
    if (fontError) {
      console.warn('Font load error', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      markTTI();
    });
    return () => task.cancel();
  }, []);

  const { isOnline } = useNetworkStatus();
  const pendingCount = useOrderQueueStore((state) => state.getPendingCount());

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ToastProvider>
        <OrderQueueProcessor />
        <CartSyncProcessor />
        <StatusBar style="auto" />
        <NetworkBanner isOnline={isOnline} isSyncing={pendingCount > 0} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_left', // RTL animation
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="tabs" options={{ headerShown: false }} />
          <Stack.Screen
            name="consent"
            options={{
              headerShown: true,
              title: 'الموافقة على الشروط',
              headerBackTitle: 'رجوع',
            }}
          />
          <Stack.Screen
            name="checkout"
            options={{
              headerShown: true,
              title: 'إتمام الطلب',
              headerBackTitle: 'السلة',
            }}
          />
          <Stack.Screen
            name="order-confirmation"
            options={{
              headerShown: false,
              gestureEnabled: false, // Prevent back gesture
            }}
          />
        </Stack>
      </ToastProvider>
    </PersistQueryClientProvider>
  );
}
