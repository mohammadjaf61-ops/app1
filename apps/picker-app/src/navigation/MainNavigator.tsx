import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OrdersListScreen } from '@/screens/OrdersListScreen';
import { OrderDetailsScreen } from '@/screens/OrderDetailsScreen';

export type MainStackParamList = {
  OrdersList: undefined;
  OrderDetails: { orderId: string };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_left',
      }}
    >
      <Stack.Screen name="OrdersList" component={OrdersListScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    </Stack.Navigator>
  );
}
