import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button, QuantityControl } from '@/components/ui';
import { useCartStore, CartItem } from '@/stores/cart-store';
import { formatCurrencyShort } from '@/lib/formatters';
import { RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 5000 : 0;
  const total = subtotal + deliveryFee;

  const renderItem = ({ item }: { item: CartItem }) => (
    <View className="flex-row bg-white rounded-xl p-3 mb-3 shadow-sm">
      {/* Product Image */}
      <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="cube-outline" size={32} color="#9ca3af" />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View className="flex-1 mr-3">
        <View className="flex-row items-start justify-between">
          <TouchableOpacity
            onPress={() => removeItem(item.productId)}
            className="p-1"
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
          <Text className="flex-1 text-gray-900 font-medium text-right" numberOfLines={2}>
            {item.nameAr}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-auto">
          <QuantityControl
            quantity={item.quantity}
            onIncrement={() => updateQuantity(item.productId, item.quantity + 1)}
            onDecrement={() => updateQuantity(item.productId, item.quantity - 1)}
          />
          <Text className="text-primary font-bold">
            {formatCurrencyShort(item.price * item.quantity)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-gray-100 w-24 h-24 rounded-full items-center justify-center mb-4">
            <Ionicons name="cart-outline" size={48} color="#9ca3af" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            السلة فارغة
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            لم تقم بإضافة أي منتجات إلى سلة التسوق بعد
          </Text>
          <Button
            title="تسوق الآن"
            onPress={() => navigation.navigate('Main')}
            size="lg"
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={clearCart}>
            <Text className="text-red-500 font-medium">مسح الكل</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">السلة</Text>
        </View>
        <Text className="text-gray-500 text-right mt-1">
          {items.length} منتج
        </Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Summary & Checkout */}
      <View className="bg-white border-t border-gray-100 px-4 py-4">
        {/* Summary */}
        <View className="space-y-2 mb-4">
          <View className="flex-row justify-between">
            <Text className="text-gray-900">{formatCurrencyShort(subtotal)}</Text>
            <Text className="text-gray-500">المجموع الفرعي</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-900">{formatCurrencyShort(deliveryFee)}</Text>
            <Text className="text-gray-500">رسوم التوصيل</Text>
          </View>
          <View className="h-px bg-gray-200 my-2" />
          <View className="flex-row justify-between">
            <Text className="text-primary text-lg font-bold">
              {formatCurrencyShort(total)}
            </Text>
            <Text className="text-gray-900 font-bold">المجموع الكلي</Text>
          </View>
        </View>

        <Button
          title="إتمام الطلب"
          onPress={() => navigation.navigate('Checkout')}
          fullWidth
          size="lg"
          icon={<Ionicons name="arrow-back" size={20} color="white" />}
        />
      </View>
    </ScreenWrapper>
  );
}
