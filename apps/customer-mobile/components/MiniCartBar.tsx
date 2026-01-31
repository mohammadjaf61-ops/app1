import { router } from 'expo-router';
import { ShoppingBag, Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrencyShort } from '../lib/formatters';
import { isStoreOpen, getDeliveryEta, getNextOpenTime } from '../lib/store-config';
import { useCartStore } from '../stores/cart-store';

export function MiniCartBar() {
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);

  const storeOpen = isStoreOpen();
  const eta = getDeliveryEta();

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
    if (storeOpen) {
      router.push('/checkout');
    }
  };

  return (
    <View
      className="absolute left-4 right-4 bg-white rounded-2xl shadow-lg border border-gray-200"
      style={{ bottom: 90 + insets.bottom }}
    >
      {/* ETA Banner */}
      {storeOpen && (
        <View className="flex-row items-center justify-center py-2 border-b border-gray-100">
          <Text className="text-gray-600 text-sm">وقت التوصيل المتوقع: {eta.text}</Text>
          <Clock size={14} color="#6b7280" className="mr-1" />
        </View>
      )}

      {/* Store Closed Banner */}
      {!storeOpen && (
        <View className="flex-row items-center justify-center py-2 border-b border-gray-100 bg-amber-50">
          <Text className="text-amber-700 text-sm font-medium">
            المتجر مغلق • يفتح {getNextOpenTime()}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={storeOpen ? 0.9 : 1}
        className="flex-row items-center justify-between p-4"
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={!storeOpen}
          className={`px-5 py-2.5 rounded-xl ${storeOpen ? 'bg-indigo-600' : 'bg-gray-300'}`}
          activeOpacity={storeOpen ? 0.8 : 1}
        >
          <Text className={`font-bold ${storeOpen ? 'text-white' : 'text-gray-500'}`}>
            {storeOpen ? 'إتمام الطلب' : 'المتجر مغلق'}
          </Text>
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
