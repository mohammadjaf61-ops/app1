import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { DeliveriesListScreen } from '@/screens/DeliveriesListScreen';
import { DeliveryDetailsScreen } from '@/screens/DeliveryDetailsScreen';

export type MainStackParamList = {
  DeliveriesList: undefined;
  DeliveryDetails: { deliveryId: string };
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
      <Stack.Screen name="DeliveriesList" component={DeliveriesListScreen} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
    </Stack.Navigator>
  );
}
