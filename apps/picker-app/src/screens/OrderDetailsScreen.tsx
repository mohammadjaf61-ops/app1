import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';

import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button, Badge, PickItemCard } from '@/components/ui';
import {
  useOrder,
  useStartPicking,
  usePickItem,
  useMarkItemUnavailable,
  useCompleteOrder,
} from '@/hooks/use-api';
import type { UnavailableReason } from '@/lib/constants';
import { formatPhone, orderStatusLabels, orderStatusColors } from '@/lib/formatters';
import type { MainStackParamList } from '@/navigation/MainNavigator';
import { usePickingStore } from '@/stores/picking-store';

type RouteProps = RouteProp<MainStackParamList, 'OrderDetails'>;

interface OrderItem {
  id: string;
  productId: string;
  product: {
    nameAr: string;
    sku: string;
    imageUrl?: string;
    aisle?: string;
    shelf?: string;
  };
  quantity: number;
  isPicked?: boolean;
  isUnavailable?: boolean;
  unavailableReason?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddressText: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
}

export function OrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { orderId } = route.params;

  const { data, isLoading, refetch } = useOrder(orderId);
  const order = data as Order | undefined;

  const startPicking = useStartPicking();
  const pickItem = usePickItem();
  const markUnavailable = useMarkItemUnavailable();
  const completeOrder = useCompleteOrder();

  const {
    startPicking: startSession,
    pickedItems,
    unavailableItems,
    isItemPicked: _isItemPicked,
    isItemUnavailable: _isItemUnavailable,
    getItemStatus,
    undoPickItem,
    isOffline,
  } = usePickingStore();

  // Start picking session when component mounts
  useEffect(() => {
    if (order && order.status === 'PICKING') {
      startSession(orderId);
    }
  }, [order?.status]);

  // Sort items by location (aisle, then shelf)
  const sortedItems = useMemo(() => {
    if (!order?.items) {
      return [];
    }

    return [...order.items].sort((a, b) => {
      const aisleA = a.product?.aisle || 'zzz';
      const aisleB = b.product?.aisle || 'zzz';
      if (aisleA !== aisleB) {
        return aisleA.localeCompare(aisleB);
      }

      const shelfA = a.product?.shelf || 'zzz';
      const shelfB = b.product?.shelf || 'zzz';
      return shelfA.localeCompare(shelfB);
    });
  }, [order?.items]);

  // Calculate progress
  const totalItems = sortedItems.length;
  const processedCount = Object.keys(pickedItems).length + Object.keys(unavailableItems).length;
  const progress = totalItems > 0 ? (processedCount / totalItems) * 100 : 0;
  const allProcessed = processedCount === totalItems && totalItems > 0;

  const handleStartPicking = async () => {
    try {
      await startPicking.mutateAsync(orderId);
      startSession(orderId);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في بدء التجهيز');
    }
  };

  const handlePickItem = async (itemId: string) => {
    if (isOffline) {
      // Handle offline - just update local state
      const { pickItem: localPick } = usePickingStore.getState();
      localPick(itemId);
      return;
    }

    try {
      await pickItem.mutateAsync({ orderId, itemId });
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في تسجيل التجهيز');
    }
  };

  const handleMarkUnavailable = async (
    itemId: string,
    reason: UnavailableReason,
    notes?: string,
  ) => {
    if (isOffline) {
      // Handle offline
      const { markUnavailable: localMark } = usePickingStore.getState();
      localMark(itemId, reason, notes);
      return;
    }

    try {
      await markUnavailable.mutateAsync({ orderId, itemId, reason, notes });
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في تسجيل عدم التوفر');
    }
  };

  const handleCompleteOrder = () => {
    if (!allProcessed) {
      Alert.alert('تنبيه', 'يرجى تجهيز جميع المنتجات قبل إكمال الطلب', [{ text: 'حسناً' }]);
      return;
    }

    const unavailableCount = Object.keys(unavailableItems).length;
    const message =
      unavailableCount > 0
        ? `سيتم إكمال الطلب مع ${unavailableCount} منتج غير متوفر. هل أنت متأكد؟`
        : 'هل أنت متأكد من إكمال الطلب؟';

    Alert.alert('إكمال الطلب', message, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إكمال',
        onPress: async () => {
          try {
            await completeOrder.mutateAsync(orderId);
            Alert.alert('تم', 'تم إكمال الطلب بنجاح', [
              { text: 'حسناً', onPress: () => navigation.goBack() },
            ]);
          } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل في إكمال الطلب');
          }
        },
      },
    ]);
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
  const isPicking = order.status === 'PICKING';

  return (
    <ScreenWrapper bgColor="#f3f4f6">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: statusColor.bg }}>
            <Text style={{ color: statusColor.text }} className="font-bold">
              {orderStatusLabels[order.status]}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-900 font-bold text-xl ml-3">طلب #{order.orderNumber}</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center bg-gray-100 rounded-xl"
            >
              <Ionicons name="arrow-forward" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar (when picking) */}
        {isPicking && (
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-sm">
                {processedCount} / {totalItems}
              </Text>
              <Text className="text-gray-700 font-medium">التقدم</Text>
            </View>
            <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
            </View>
          </View>
        )}
      </View>

      {/* Offline Banner */}
      <OfflineBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#16a34a']}
            tintColor="#16a34a"
          />
        }
      >
        {/* Customer Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4">
          <Text className="text-gray-900 font-bold text-right mb-3">معلومات العميل</Text>
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
            <View className="mt-3 pt-3 border-t border-gray-100">
              <Text className="text-amber-600 text-right">ملاحظات: {order.notes}</Text>
            </View>
          )}
        </View>

        {/* Start Picking Button (if pending) */}
        {order.status === 'PENDING' && (
          <View className="mx-4 mt-4">
            <Button
              title="بدء التجهيز"
              onPress={handleStartPicking}
              loading={startPicking.isPending}
              size="xl"
              fullWidth
              icon={<Ionicons name="play-circle-outline" size={24} color="white" />}
            />
          </View>
        )}

        {/* Items List */}
        <View className="px-4 mt-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Badge label={`${totalItems} منتج`} variant="default" size="md" />
            <Text className="text-gray-900 font-bold text-lg">المنتجات للتجهيز</Text>
          </View>

          {/* Group by location */}
          {isPicking
            ? // Picking mode - show individual items with actions
              sortedItems.map((item) => {
                const localStatus = getItemStatus(item.id);
                const serverStatus = item.isPicked
                  ? 'picked'
                  : item.isUnavailable
                    ? 'unavailable'
                    : 'pending';
                const status = localStatus !== 'pending' ? localStatus : serverStatus;

                return (
                  <PickItemCard
                    key={item.id}
                    item={item}
                    status={status}
                    unavailableReason={unavailableItems[item.id]?.reason || item.unavailableReason}
                    onPick={() => handlePickItem(item.id)}
                    onMarkUnavailable={(reason, notes) =>
                      handleMarkUnavailable(item.id, reason, notes)
                    }
                    onUndo={status !== 'pending' ? () => undoPickItem(item.id) : undefined}
                    disabled={pickItem.isPending || markUnavailable.isPending}
                  />
                );
              })
            : // View mode - just show items
              sortedItems.map((item) => (
                <View key={item.id} className="bg-white rounded-xl p-4 mb-2 flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium text-right">
                      {item.product.nameAr}
                    </Text>
                    <Text className="text-gray-400 text-sm text-right">
                      الكمية: {item.quantity}
                    </Text>
                  </View>
                  <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                    <Ionicons name="cube-outline" size={20} color="#9ca3af" />
                  </View>
                </View>
              ))}
        </View>
      </ScrollView>

      {/* Complete Button (when picking) */}
      {isPicking && (
        <View className="p-4 bg-white border-t border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row">
              {Object.keys(unavailableItems).length > 0 && (
                <Badge
                  label={`${Object.keys(unavailableItems).length} غير متوفر`}
                  variant="danger"
                  size="sm"
                />
              )}
            </View>
            <Text className="text-gray-500">
              تم تجهيز {Object.keys(pickedItems).length} من {totalItems}
            </Text>
          </View>
          <Button
            title={allProcessed ? 'إكمال الطلب' : 'أكمل جميع المنتجات أولاً'}
            onPress={handleCompleteOrder}
            loading={completeOrder.isPending}
            disabled={!allProcessed || isOffline}
            size="xl"
            fullWidth
            variant={allProcessed ? 'success' : 'secondary'}
            icon={
              allProcessed ? (
                <Ionicons name="checkmark-done-circle-outline" size={24} color="white" />
              ) : undefined
            }
          />
        </View>
      )}
    </ScreenWrapper>
  );
}
