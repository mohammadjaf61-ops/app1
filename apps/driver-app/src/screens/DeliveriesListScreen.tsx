import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, FlatList, RefreshControl, Alert, TouchableOpacity } from 'react-native';

import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { DeliveryCard, Badge } from '@/components/ui';
import { useAssignedDeliveries, useDriverStats } from '@/hooks/use-api';
import { formatCurrencyShort } from '@/lib/formatters';
import type { MainStackParamList } from '@/navigation/MainNavigator';
import { useAuthStore } from '@/stores/auth-store';
import { useDeliveryStore } from '@/stores/delivery-store';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Delivery {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  deliveryAddressText: string;
  total: number;
  paymentMethod?: string;
  createdAt: string;
  items?: any[];
}

export function DeliveriesListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { isOffline } = useDeliveryStore();

  const { data: deliveries, isLoading, refetch } = useAssignedDeliveries();
  const { data: stats } = useDriverStats();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: logout },
    ]);
  };

  // Separate deliveries by status
  const readyDeliveries = deliveries?.filter((d: Delivery) => d.status === 'READY') || [];
  const outForDeliveryList =
    deliveries?.filter((d: Delivery) => d.status === 'OUT_FOR_DELIVERY') || [];

  const renderDelivery = ({ item }: { item: Delivery }) => (
    <DeliveryCard
      delivery={{
        ...item,
        itemsCount: item.items?.length,
      }}
      onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
    />
  );

  const renderHeader = () => (
    <View className="mb-4">
      {/* Stats Cards */}
      {stats && (
        <View className="flex-row px-4 mb-4">
          <View className="flex-1 bg-white rounded-xl p-4 ml-2">
            <View className="flex-row items-center justify-end mb-2">
              <Ionicons name="checkmark-done-circle-outline" size={20} color="#22c55e" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-right">
              {stats.todayDelivered}
            </Text>
            <Text className="text-gray-500 text-sm text-right">تم توصيلها اليوم</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 mr-2">
            <View className="flex-row items-center justify-end mb-2">
              <Ionicons name="cash-outline" size={20} color="#0ea5e9" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-right">
              {formatCurrencyShort(stats.totalEarnings || 0)}
            </Text>
            <Text className="text-gray-500 text-sm text-right">الإيرادات اليوم</Text>
          </View>
        </View>
      )}

      {/* Out for Delivery Section */}
      {outForDeliveryList.length > 0 && (
        <View className="mb-4">
          <View className="px-4 flex-row items-center justify-between mb-3">
            <Badge label={`${outForDeliveryList.length}`} variant="primary" size="md" />
            <Text className="text-gray-900 font-bold text-lg">في الطريق</Text>
          </View>
          <View className="px-4">
            {outForDeliveryList.map((delivery: Delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={{ ...delivery, itemsCount: delivery.items?.length }}
                onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: delivery.id })}
              />
            ))}
          </View>
        </View>
      )}

      {/* Ready for Pickup Section */}
      <View className="px-4 flex-row items-center justify-between">
        <Badge label={`${readyDeliveries.length}`} variant="success" size="md" />
        <Text className="text-gray-900 font-bold text-lg">جاهزة للاستلام</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
        <Ionicons name="car-outline" size={48} color="#9ca3af" />
      </View>
      <Text className="text-gray-900 font-bold text-xl mb-2">لا توجد توصيلات حالياً</Text>
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

      {/* Deliveries List */}
      <FlatList
        data={readyDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderDelivery}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading && outForDeliveryList.length === 0 ? renderEmpty : null}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 24,
          paddingHorizontal: 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#0ea5e9']}
            tintColor="#0ea5e9"
          />
        }
      />
    </ScreenWrapper>
  );
}
