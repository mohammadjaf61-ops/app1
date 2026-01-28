import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useOrders } from '@/hooks/use-api';
import {
  formatCurrencyShort,
  formatDateTime,
  orderStatusLabels,
  orderStatusColors,
} from '@/lib/formatters';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ quantity: number }>;
}

export function OrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { data, isLoading, refetch } = useOrders();

  const orders = ((data as any)?.data || data || []) as Order[];

  const renderOrder = ({ item }: { item: Order }) => {
    const statusColor = orderStatusColors[item.status] || { bg: '#f3f4f6', text: '#374151' };
    const itemCount = item.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-4 mb-3 shadow-sm"
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="px-3 py-1 rounded-full" style={{ backgroundColor: statusColor.bg }}>
            <Text style={{ color: statusColor.text }} className="text-sm font-medium">
              {orderStatusLabels[item.status] || item.status}
            </Text>
          </View>
          <Text className="text-gray-900 font-bold">#{item.orderNumber}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="chevron-back" size={20} color="#9ca3af" />
            <Text className="text-primary font-bold ml-2">{formatCurrencyShort(item.total)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-500 text-sm">{formatDateTime(item.createdAt)}</Text>
            <Text className="text-gray-400 text-xs">{itemCount} منتج</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 text-right">طلباتي</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-4">
              <Ionicons name="receipt-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">لا توجد طلبات</Text>
            <Text className="text-gray-500 text-center">لم تقم بأي طلبات بعد</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}
