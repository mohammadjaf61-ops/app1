import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';

import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Badge } from '@/components/ui';
import { useAssignedOrders, usePickerStats } from '@/hooks/use-api';
import {
  formatTimeElapsed,
  getUrgencyLevel,
  orderStatusLabels,
  orderStatusColors,
} from '@/lib/formatters';
import type { MainStackParamList } from '@/navigation/MainNavigator';
import { useAuthStore } from '@/stores/auth-store';
import { usePickingStore } from '@/stores/picking-store';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  createdAt: string;
  items: any[];
  priority?: number;
}

export function OrdersListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { isOffline } = usePickingStore();

  const { data: orders, isLoading, refetch } = useAssignedOrders();
  const { data: stats } = usePickerStats();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const urgency = getUrgencyLevel(item.createdAt);
    const statusColor = orderStatusColors[item.status] || { bg: '#f3f4f6', text: '#374151' };
    const itemsCount = item.items?.length || 0;

    return (
      <TouchableOpacity
        className={`
          bg-white rounded-2xl p-4 mb-3 mx-4
          border-r-4
          ${urgency === 'urgent' ? 'border-red-500' : urgency === 'warning' ? 'border-amber-500' : 'border-primary'}
        `}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            {urgency === 'urgent' && <Badge label="عاجل" variant="urgent" size="sm" />}
            {urgency === 'warning' && (
              <View className="mr-2">
                <Badge label="أولوية" variant="warning" size="sm" />
              </View>
            )}
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-900 font-bold text-lg">#{item.orderNumber}</Text>
            <View
              className="px-2 py-1 rounded-full mr-2"
              style={{ backgroundColor: statusColor.bg }}
            >
              <Text style={{ color: statusColor.text }} className="text-xs font-medium">
                {orderStatusLabels[item.status]}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer & Time */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#9ca3af" />
            <Text className="text-gray-500 text-sm mr-1">{formatTimeElapsed(item.createdAt)}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="person-outline" size={16} color="#9ca3af" />
            <Text className="text-gray-600 mr-1">{item.customerName}</Text>
          </View>
        </View>

        {/* Items Count */}
        <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mt-2">
          <Ionicons name="chevron-back" size={20} color="#9ca3af" />
          <View className="flex-row items-center">
            <Text className="text-gray-900 font-bold text-lg ml-1">{itemsCount}</Text>
            <Text className="text-gray-500">منتج للتجهيز</Text>
            <Ionicons name="cube-outline" size={18} color="#6b7280" className="mr-2" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View className="mb-4">
      {/* Stats Cards */}
      {stats && (
        <View className="flex-row px-4 mb-4">
          <View className="flex-1 bg-white rounded-xl p-4 ml-2">
            <View className="flex-row items-center justify-end mb-2">
              <Ionicons name="checkmark-circle-outline" size={20} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-right">
              {stats.todayCompleted}
            </Text>
            <Text className="text-gray-500 text-sm text-right">طلبات اليوم</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 mr-2">
            <View className="flex-row items-center justify-end mb-2">
              <Ionicons name="cube-outline" size={20} color="#0ea5e9" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-right">{stats.todayItems}</Text>
            <Text className="text-gray-500 text-sm text-right">منتج تم تجهيزه</Text>
          </View>
        </View>
      )}

      {/* Section Title */}
      <View className="px-4 flex-row items-center justify-between">
        <Badge label={`${orders?.length || 0} طلب`} variant="default" size="md" />
        <Text className="text-gray-900 font-bold text-lg">الطلبات المسندة إليك</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
        <Ionicons name="clipboard-outline" size={48} color="#9ca3af" />
      </View>
      <Text className="text-gray-900 font-bold text-xl mb-2">لا توجد طلبات حالياً</Text>
      <Text className="text-gray-500 text-center">سيتم إشعارك عند إسناد طلبات جديدة إليك</Text>
    </View>
  );

  return (
    <ScreenWrapper bgColor="#f3f4f6">
      {/* Header */}
      <View className="bg-primary px-4 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleLogout}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 items-end mr-4">
            <Text className="text-white/80 text-sm">مرحباً</Text>
            <Text className="text-white font-bold text-lg">{user?.fullName}</Text>
          </View>
        </View>
      </View>

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Orders List */}
      <FlatList
        data={orders || []}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#16a34a']}
            tintColor="#16a34a"
          />
        }
      />
    </ScreenWrapper>
  );
}
