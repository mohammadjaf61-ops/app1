import { router } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrencyShort } from '../lib/formatters';
import { useCartStore } from '../stores/cart-store';

export function MiniCartBar() {
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);

  const { itemCount, total } = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = items.length > 0 ? 5000 : 0;
    return { itemCount: count, total: subtotal + deliveryFee };
  }, [items]);

  if (itemCount === 0) {
    return null;
  }

  const handlePress = () => {
    router.push('/checkout');
  };

  return (
    <View
      className="absolute left-4 right-4 bg-white rounded-2xl shadow-lg border border-gray-200"
      style={{ bottom: 90 + insets.bottom }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="flex-row items-center justify-between p-4"
      >
        <TouchableOpacity
          onPress={handlePress}
          className="bg-indigo-600 px-5 py-2.5 rounded-xl"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold">إتمام الطلب</Text>
        </TouchableOpacity>

        <View className="flex-row items-center">
          <View className="mr-3">
            <Text className="text-gray-900 font-bold text-lg text-right">
              {formatCurrencyShort(total)}
            </Text>
            <Text className="text-gray-500 text-sm text-right">
              {itemCount} منتج
            </Text>
          </View>
          <View className="bg-indigo-100 w-12 h-12 rounded-full items-center justify-center">
            <ShoppingBag size={24} color="#4f46e5" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
