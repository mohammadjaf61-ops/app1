import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { OrderDetailsScreen } from '@/screens/OrderDetailsScreen';
import { OrdersListScreen } from '@/screens/OrdersListScreen';

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
