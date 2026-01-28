import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { CheckoutScreen } from '@/screens/CheckoutScreen';
import { OrderDetailsScreen } from '@/screens/OrderDetailsScreen';
import { ProductScreen } from '@/screens/ProductScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { useAuthStore } from '@/stores/auth-store';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Product: { productId: string };
  Checkout: undefined;
  OrderDetails: { orderId: string };
  Search: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    // TODO: Add splash screen
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_left', // RTL animation
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Product"
            component={ProductScreen}
            options={{
              headerShown: true,
              headerTitle: 'تفاصيل المنتج',
              headerBackTitle: 'رجوع',
            }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{
              headerShown: true,
              headerTitle: 'إتمام الطلب',
              headerBackTitle: 'رجوع',
            }}
          />
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{
              headerShown: true,
              headerTitle: 'تفاصيل الطلب',
              headerBackTitle: 'رجوع',
            }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
