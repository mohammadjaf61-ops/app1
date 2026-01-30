import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, ScrollView, Image, RefreshControl, Alert } from 'react-native';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui';
import { useOrder } from '@/hooks/use-api';
import {
  formatCurrencyShort,
  formatDateTime,
  formatPhone,
  orderStatusLabels,
  orderStatusColors,
} from '@/lib/formatters';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useCartStore } from '@/stores/cart-store';

type Props = {
  route: RouteProp<RootStackParamList, 'OrderDetails'>;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OrderItem {
  id: string;
  productId: string;
  product: {
    nameAr: string;
    sku: string;
    imageUrl?: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddressText: string;
  notes?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const statusSteps = ['PENDING', 'PICKING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export function OrderDetailsScreen({ route }: Props) {
  const { orderId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const { data, isLoading, refetch } = useOrder(orderId);
  const { clearCart, addItem } = useCartStore();

  const order = data as Order | undefined;

  const handleReorder = () => {
    if (!order?.items?.length) return;

    Alert.alert(
      'إعادة الطلب',
      'سيتم استبدال محتويات السلة الحالية بمنتجات هذا الطلب. متابعة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'متابعة',
          onPress: () => {
            // Clear current cart
            clearCart();

            // Add all items from this order
            order.items.forEach((item) => {
              addItem(
                {
                  productId: item.productId,
                  sku: item.product?.sku || '',
                  nameAr: item.product?.nameAr || '',
                  price: item.unitPrice,
                  imageUrl: item.product?.imageUrl,
                },
                item.quantity,
              );
            });

            // Navigate to checkout
            navigation.navigate('Checkout');
          },
        },
      ],
    );
  };

  if (isLoading || !order) {
    return (
      <ScreenWrapper bgColor="#fff">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">جاري التحميل...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const statusColor = orderStatusColors[order.status] || { bg: '#f3f4f6', text: '#374151' };
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <ScreenWrapper bgColor="#fff">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View className="p-4">
          {/* Order Header */}
          <View className="items-center mb-6">
            <View
              className="px-4 py-2 rounded-full mb-3"
              style={{ backgroundColor: statusColor.bg }}
            >
              <Text style={{ color: statusColor.text }} className="font-bold text-lg">
                {orderStatusLabels[order.status] || order.status}
              </Text>
            </View>
            <Text className="text-gray-500">رقم الطلب</Text>
            <Text className="text-2xl font-bold text-gray-900">#{order.orderNumber}</Text>
            <Text className="text-gray-400 text-sm mt-1">{formatDateTime(order.createdAt)}</Text>
          </View>

          {/* Status Timeline */}
          {order.status !== 'CANCELLED' && (
            <View className="mb-6">
              <View className="flex-row-reverse justify-between px-4">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <View key={step} className="items-center flex-1">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          isCompleted ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={18} color="white" />
                        ) : (
                          <Text className="text-gray-400 text-xs">{index + 1}</Text>
                        )}
                      </View>
                      <Text
                        className={`text-xs mt-1 text-center ${
                          isCurrent ? 'text-primary font-bold' : 'text-gray-400'
                        }`}
                        numberOfLines={1}
                      >
                        {orderStatusLabels[step]?.split(' ')[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Delivery Info */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-900 font-bold text-right mb-3">معلومات التوصيل</Text>
            <View className="space-y-2">
              <View className="flex-row items-center justify-end">
                <Text className="text-gray-600 mr-2">{order.customerName}</Text>
                <Ionicons name="person-outline" size={18} color="#9ca3af" />
              </View>
              <View className="flex-row items-center justify-end">
                <Text className="text-gray-600 mr-2" dir="ltr">
                  {formatPhone(order.customerPhone)}
                </Text>
                <Ionicons name="call-outline" size={18} color="#9ca3af" />
              </View>
              <View className="flex-row items-start justify-end">
                <Text className="text-gray-600 mr-2 text-right flex-1">
                  {order.deliveryAddressText}
                </Text>
                <Ionicons name="location-outline" size={18} color="#9ca3af" />
              </View>
            </View>
            {order.notes && (
              <View className="mt-3 pt-3 border-t border-gray-200">
                <Text className="text-gray-500 text-sm text-right">ملاحظات: {order.notes}</Text>
              </View>
            )}
          </View>

          {/* Order Items */}
          <View className="mb-4">
            <Text className="text-gray-900 font-bold text-right mb-3">
              المنتجات ({order.items?.length})
            </Text>
            {order.items?.map((item) => (
              <View key={item.id} className="flex-row bg-gray-50 rounded-xl p-3 mb-2">
                <View className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                  {item.product?.imageUrl ? (
                    <Image
                      source={{ uri: item.product.imageUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="cube-outline" size={24} color="#9ca3af" />
                    </View>
                  )}
                </View>
                <View className="flex-1 mr-3">
                  <Text className="text-gray-900 font-medium text-right">
                    {item.product?.nameAr}
                  </Text>
                  <Text className="text-gray-400 text-sm text-right">
                    {item.quantity} × {formatCurrencyShort(item.unitPrice)}
                  </Text>
                </View>
                <Text className="text-primary font-bold">{formatCurrencyShort(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* Price Summary */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-900">{formatCurrencyShort(order.subtotal)}</Text>
              <Text className="text-gray-500">المجموع الفرعي</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-900">{formatCurrencyShort(order.deliveryFee)}</Text>
              <Text className="text-gray-500">رسوم التوصيل</Text>
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between">
              <Text className="text-primary text-xl font-bold">
                {formatCurrencyShort(order.total)}
              </Text>
              <Text className="text-gray-900 font-bold">المجموع الكلي</Text>
            </View>
          </View>

          {/* Re-order Button */}
          <Button
            title="إعادة الطلب"
            onPress={handleReorder}
            variant="outline"
            fullWidth
            icon={<Ionicons name="refresh-outline" size={20} color="#16a34a" />}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
