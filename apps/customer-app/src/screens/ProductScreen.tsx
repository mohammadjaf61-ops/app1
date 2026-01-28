import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui';
import { useProduct } from '@/hooks/use-api';
import { formatCurrencyShort } from '@/lib/formatters';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useCartStore } from '@/stores/cart-store';

type Props = {
  route: RouteProp<RootStackParamList, 'Product'>;
};

export function ProductScreen({ route }: Props) {
  const { productId } = route.params;
  const { data: product, isLoading } = useProduct(productId);
  const { addItem, getItemQuantity, updateQuantity } = useCartStore();

  const quantity = getItemQuantity(productId);
  const [localQuantity, setLocalQuantity] = useState(1);

  if (isLoading || !product) {
    return (
      <ScreenWrapper bgColor="#fff">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">جاري التحميل...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const productData = product as {
    id: string;
    sku: string;
    nameAr: string;
    descriptionAr?: string;
    price: number;
    imageUrl?: string;
    category?: { nameAr: string };
  };

  const handleAddToCart = () => {
    addItem(
      {
        productId: productData.id,
        sku: productData.sku,
        nameAr: productData.nameAr,
        price: productData.price,
        imageUrl: productData.imageUrl,
      },
      localQuantity,
    );
  };

  const incrementLocal = () => setLocalQuantity((q) => q + 1);
  const decrementLocal = () => setLocalQuantity((q) => Math.max(1, q - 1));

  return (
    <ScreenWrapper bgColor="#fff">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View className="h-72 bg-gray-100">
          {productData.imageUrl ? (
            <Image
              source={{ uri: productData.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="cube-outline" size={80} color="#9ca3af" />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="p-4">
          {/* Category */}
          {productData.category && (
            <View className="flex-row justify-end mb-2">
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-primary text-sm">{productData.category.nameAr}</Text>
              </View>
            </View>
          )}

          {/* Name */}
          <Text className="text-2xl font-bold text-gray-900 text-right mb-2">
            {productData.nameAr}
          </Text>

          {/* SKU */}
          <Text className="text-gray-400 text-sm text-right mb-4">SKU: {productData.sku}</Text>

          {/* Price */}
          <View className="flex-row items-center justify-end mb-6">
            <Text className="text-primary text-2xl font-bold">
              {formatCurrencyShort(productData.price)}
            </Text>
          </View>

          {/* Description */}
          {productData.descriptionAr && (
            <View className="mb-6">
              <Text className="text-gray-900 font-bold text-right mb-2">الوصف</Text>
              <Text className="text-gray-600 text-right leading-6">
                {productData.descriptionAr}
              </Text>
            </View>
          )}

          {/* Quantity Selector */}
          <View className="mb-6">
            <Text className="text-gray-900 font-bold text-right mb-3">الكمية</Text>
            <View className="flex-row items-center justify-end">
              <View className="flex-row items-center bg-gray-100 rounded-xl">
                <TouchableOpacity
                  onPress={incrementLocal}
                  className="w-12 h-12 items-center justify-center"
                >
                  <Ionicons name="add" size={24} color="#16a34a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 mx-4 min-w-[40px] text-center">
                  {localQuantity}
                </Text>
                <TouchableOpacity
                  onPress={decrementLocal}
                  className="w-12 h-12 items-center justify-center"
                >
                  <Ionicons name="remove" size={24} color="#16a34a" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Cart indicator */}
          {quantity > 0 && (
            <View className="bg-primary/10 p-3 rounded-xl mb-4">
              <Text className="text-primary text-center">{quantity} من هذا المنتج في السلة</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View className="p-4 bg-white border-t border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-primary text-xl font-bold">
            {formatCurrencyShort(productData.price * localQuantity)}
          </Text>
          <Text className="text-gray-500">المجموع ({localQuantity} قطعة)</Text>
        </View>
        <Button
          title="إضافة إلى السلة"
          onPress={handleAddToCart}
          fullWidth
          size="lg"
          icon={<Ionicons name="cart-outline" size={20} color="white" />}
        />
      </View>
    </ScreenWrapper>
  );
}
