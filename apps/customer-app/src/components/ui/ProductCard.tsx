import React from 'react';
import { View, Text, Image, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatCurrencyShort } from '@/lib/formatters';
import { useCartStore } from '@/stores/cart-store';

interface ProductCardProps {
  product: {
    id: string;
    sku: string;
    nameAr: string;
    price: number;
    imageUrl?: string;
  };
  onPress: () => void;
  variant?: 'default' | 'horizontal' | 'compact';
}

export function ProductCard({
  product,
  onPress,
  variant = 'default',
}: ProductCardProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCartStore();
  const quantity = getItemQuantity(product.id);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      sku: product.sku,
      nameAr: product.nameAr,
      price: product.price,
      imageUrl: product.imageUrl,
    });
  };

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(product.id, quantity - 1);
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-row bg-white rounded-xl p-3 mb-3 shadow-sm"
        activeOpacity={0.7}
      >
        <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="cube-outline" size={32} color="#9ca3af" />
            </View>
          )}
        </View>
        <View className="flex-1 mr-3 justify-between">
          <Text className="text-gray-900 font-medium text-right" numberOfLines={2}>
            {product.nameAr}
          </Text>
          <Text className="text-primary font-bold text-right">
            {formatCurrencyShort(product.price)}
          </Text>
        </View>
        <View className="justify-center">
          {quantity > 0 ? (
            <QuantityControl
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          ) : (
            <TouchableOpacity
              onPress={handleAddToCart}
              className="bg-primary w-10 h-10 rounded-full items-center justify-center"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Default vertical card
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl overflow-hidden shadow-sm w-40"
      activeOpacity={0.7}
    >
      <View className="h-32 bg-gray-100">
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="cube-outline" size={40} color="#9ca3af" />
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="text-gray-900 font-medium text-right mb-1" numberOfLines={2}>
          {product.nameAr}
        </Text>
        <View className="flex-row items-center justify-between">
          <View>
            {quantity > 0 ? (
              <QuantityControl
                quantity={quantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                size="sm"
              />
            ) : (
              <TouchableOpacity
                onPress={handleAddToCart}
                className="bg-primary w-8 h-8 rounded-full items-center justify-center"
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-primary font-bold">
            {formatCurrencyShort(product.price)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface QuantityControlProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
}

function QuantityControl({
  quantity,
  onIncrement,
  onDecrement,
  size = 'md',
}: QuantityControlProps) {
  const buttonSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <View className="flex-row items-center bg-gray-100 rounded-full">
      <Pressable
        onPress={onDecrement}
        className={`${buttonSize} rounded-full items-center justify-center`}
      >
        <Ionicons
          name={quantity === 1 ? 'trash-outline' : 'remove'}
          size={iconSize}
          color={quantity === 1 ? '#ef4444' : '#16a34a'}
        />
      </Pressable>
      <Text className="mx-2 font-bold text-gray-900 min-w-[20px] text-center">
        {quantity}
      </Text>
      <Pressable
        onPress={onIncrement}
        className={`${buttonSize} bg-primary rounded-full items-center justify-center`}
      >
        <Ionicons name="add" size={iconSize} color="white" />
      </Pressable>
    </View>
  );
}

export { QuantityControl };
