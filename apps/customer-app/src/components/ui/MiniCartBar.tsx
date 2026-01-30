import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';

import { useT } from '@/hooks/use-t';
import { formatCurrencyShort } from '@/lib/formatters';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useCartStore } from '@/stores/cart-store';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MiniCartBarProps {
  /** Navigate to Checkout instead of Cart tab */
  toCheckout?: boolean;
}

export function MiniCartBar({ toCheckout = false }: MiniCartBarProps) {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useT();
  const items = useCartStore((state) => state.items);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Don't render if cart is empty
  if (itemCount === 0) {
    return null;
  }

  const handlePress = () => {
    if (toCheckout) {
      navigation.navigate('Checkout');
    } else {
      // Navigate to Cart tab within Main navigator
      navigation.navigate('Main', { screen: 'Cart' } as never);
    }
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 px-4 pb-4">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="bg-primary flex-row items-center justify-between px-4 py-3 rounded-2xl shadow-lg"
        style={{
          shadowColor: '#16a34a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Item count badge */}
        <View className="flex-row items-center">
          <View className="bg-white/20 rounded-full px-3 py-1">
            <Text className="text-white font-bold">{itemCount}</Text>
          </View>
          <Ionicons name="cart" size={24} color="white" style={{ marginLeft: 8 }} />
        </View>

        {/* Action text */}
        <Text className="text-white font-bold text-base">
          {toCheckout ? t('checkout.title') : t('cart.viewCart')}
        </Text>

        {/* Total */}
        <View className="flex-row items-center">
          <Text className="text-white font-bold text-lg">{formatCurrencyShort(total)}</Text>
          <Ionicons name="chevron-back" size={20} color="white" style={{ marginRight: 4 }} />
        </View>
      </TouchableOpacity>
    </View>
  );
}
