import { Tabs } from 'expo-router';
import { Home, ShoppingCart, ClipboardList, User } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { colors } from '@hypermarket/design-tokens';

import { useCartStore } from '../../stores/cart-store';

function CartTabIcon({ color, size }: { color: string; size: number }) {
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <View>
      <ShoppingCart size={size} color={color} />
      {itemCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -6,
            right: -10,
            backgroundColor: colors.status.error.main,
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border.default,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'السلة',
          tabBarIcon: ({ color, size }) => <CartTabIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'الطلبات',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
