import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';

import { ToastProvider } from '../components/Toast';
import { useOrderQueueProcessor } from '../hooks/use-network';
import { queryClient, persistOptions } from '../lib/query-client';

function OrderQueueProcessor() {
  useOrderQueueProcessor();
  return null;
}

SplashScreen.preventAutoHideAsync();

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
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
    // Hide splash screen once fonts are loaded
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Wait for fonts to load before rendering
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ToastProvider>
        <OrderQueueProcessor />
        <StatusBar style="auto" />
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
