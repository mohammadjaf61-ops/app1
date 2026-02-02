import { router } from 'expo-router';
import { ShoppingCart, Trash2, Plus, Minus, Package } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Pressable,
} from 'react-native';
import { colors } from '@hypermarket/design-tokens';

import { EmptyState } from '../../../components/EmptyState';
import { useToast } from '../../../components/Toast';
import { formatCurrencyShort } from '../../../lib/formatters';
import type { CartItem } from '../../../stores/cart-store';
import { useCartStore } from '../../../stores/cart-store';

function QuantityControl({
  quantity,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View className="flex-row items-center bg-gray-100 rounded-lg">
      <TouchableOpacity
        onPress={onIncrement}
        className="w-8 h-8 items-center justify-center"
        activeOpacity={0.7}
      >
        <Plus size={16} color={colors.primary[500]} />
      </TouchableOpacity>
      <Text className="w-8 text-center font-semibold text-gray-900">{quantity}</Text>
      <TouchableOpacity
        onPress={onDecrement}
        className="w-8 h-8 items-center justify-center"
        activeOpacity={0.7}
      >
        <Minus
          size={16}
          color={quantity <= 1 ? colors.text.disabled : colors.primary[500]}
        />
      </TouchableOpacity>
    </View>
  );
}

function CartItemRow({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const { showToast } = useToast();

  const handleIncrement = () => {
    updateQuantity(item.productId, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      onRemove();
    } else {
      updateQuantity(item.productId, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    Alert.alert('إزالة المنتج', `هل تريد إزالة "${item.nameAr}" من السلة؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إزالة',
        style: 'destructive',
        onPress: () => {
          onRemove();
          showToast('تمت إزالة المنتج من السلة', 'info');
        },
      },
    ]);
  };

  return (
    <View className="flex-row bg-white dark:bg-primary-900/50 rounded-xl p-3 mb-3 shadow-sm border border-gray-100 dark:border-primary-800">
      {/* Product Image */}
      <View className="w-20 h-20 bg-gray-100 dark:bg-primary-800/60 rounded-lg overflow-hidden items-center justify-center">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Package size={32} color={colors.text.tertiary} />
        )}
      </View>

      {/* Product Info */}
      <View className="flex-1 mr-3">
        <View className="flex-row items-start justify-between">
          <TouchableOpacity onPress={handleRemove} className="p-1" activeOpacity={0.7}>
            <Trash2 size={18} color={colors.status.error.main} />
          </TouchableOpacity>
          <Text className="flex-1 text-gray-900 font-medium text-right" numberOfLines={2}>
            {item.nameAr}
          </Text>
        </View>

        <Text className="text-gray-500 text-sm text-right mt-1">
          {formatCurrencyShort(item.price)} للقطعة
        </Text>

        <View className="flex-row items-center justify-between mt-auto pt-2">
          <QuantityControl
            quantity={item.quantity}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
          <Text className="text-primary font-bold text-lg">
            {formatCurrencyShort(item.price * item.quantity)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { items, clearCart, removeItem, getSubtotal, getDeliveryFee, getTotal } = useCartStore();
  const { showToast } = useToast();
  const [isProcessing, _setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const handleClearCart = () => {
    Alert.alert('تفريغ السلة', 'هل تريد إزالة جميع المنتجات من السلة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تفريغ',
        style: 'destructive',
        onPress: () => {
          clearCart();
          showToast('تم تفريغ السلة', 'info');
        },
      },
    ]);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast('السلة فارغة', 'warning');
      return;
    }
    router.push('/checkout');
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <EmptyState variant="cart" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-primary-900">
      {/* Header */}
      <View className="bg-white dark:bg-primary-900 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-primary-800">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={handleClearCart} activeOpacity={0.7}>
            <Text className="text-red-500 font-medium">تفريغ السلة</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">السلة</Text>
        </View>
        <Text className="text-gray-500 dark:text-gray-300 text-right mt-1">
          {items.length} منتج • {items.reduce((sum, i) => sum + i.quantity, 0)} قطعة
        </Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => (
          <CartItemRow item={item} onRemove={() => removeItem(item.productId)} />
        )}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Summary & Checkout */}
      <View className="bg-white dark:bg-primary-900 border-t border-gray-200 dark:border-primary-800 px-4 py-4 shadow-lg">
        {/* Summary */}
        <View className="mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-900 dark:text-gray-100">{formatCurrencyShort(subtotal)}</Text>
            <Text className="text-gray-500 dark:text-gray-300">المنتجات</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-900 dark:text-gray-100">{formatCurrencyShort(deliveryFee)}</Text>
            <Text className="text-gray-500 dark:text-gray-300">رسوم التوصيل</Text>
          </View>
          <View className="h-px bg-gray-200 dark:bg-primary-800 my-2" />
          <View className="flex-row justify-between">
            <Text className="text-primary dark:text-primary-200 text-xl font-bold">
              {formatCurrencyShort(total)}
            </Text>
            <Text className="text-gray-900 dark:text-gray-100 font-bold text-lg">
              المجموع الكلي
            </Text>
          </View>
        </View>

        {/* Checkout Button */}
        <Pressable
          onPress={handleCheckout}
          disabled={isProcessing}
          className={`bg-primary py-4 rounded-xl flex-row items-center justify-center ${
            isProcessing ? 'opacity-70' : ''
          }`}
        >
          <Text className="text-white font-bold text-lg ml-2">إتمام الطلب</Text>
          <ShoppingCart size={20} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
