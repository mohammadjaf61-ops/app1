import { Clock, Wifi } from 'lucide-react-native';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';

import { EmptyState } from '../../../components/EmptyState';
import { useNetworkStatus, useOrderQueueStore } from '@hypermarket/mobile-core';

export default function OrdersScreen() {
  const { isOnline } = useNetworkStatus();
  const pendingOrders = useOrderQueueStore((state) => state.pendingOrders);
  const retryOrder = useOrderQueueStore((state) => state.retryOrder);
  const pendingCount = pendingOrders.filter((o) => o.status !== 'sent').length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 text-right">طلباتي</Text>
      </View>

      {/* Pending Orders Banner */}
      {pendingCount > 0 && (
        <View className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              {!isOnline ? (
                <Wifi size={20} color="#d97706" />
              ) : (
                <Clock size={20} color="#d97706" />
              )}
            </View>
            <View className="flex-1 mr-3">
              <Text className="text-amber-800 font-semibold text-right">
                طلبات قيد الإرسال: {pendingCount}
              </Text>
              <Text className="text-amber-600 text-sm text-right">
                {!isOnline
                  ? 'سيتم إرسالها عند توفر الإنترنت'
                  : 'جاري إرسال الطلبات...'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Pending Orders List */}
      {pendingOrders.length > 0 ? (
        <ScrollView className="flex-1 px-4">
          {pendingOrders.map((order) => (
            <View
              key={order.id}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className={`px-2 py-1 rounded-full ${
                    order.status === 'sending'
                      ? 'bg-blue-100'
                      : order.status === 'failed'
                        ? 'bg-red-100'
                        : 'bg-amber-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      order.status === 'sending'
                        ? 'text-blue-700'
                        : order.status === 'failed'
                          ? 'text-red-700'
                          : 'text-amber-700'
                    }`}
                  >
                    {order.status === 'sending'
                      ? 'جاري الإرسال'
                      : order.status === 'failed'
                        ? 'فشل الإرسال'
                        : 'قيد الانتظار'}
                  </Text>
                </View>
                <Text className="text-gray-500 text-sm">
                  {new Date(order.createdAt).toLocaleTimeString('ar-IQ')}
                </Text>
              </View>
              <Text className="text-gray-900 font-medium text-right">
                {order.payload.items.length} منتج • {order.payload.items.reduce((sum, i) => sum + i.quantity, 0)} قطعة
              </Text>
              <Text className="text-gray-500 text-sm text-right">
                {order.payload.deliveryAddressText.slice(0, 40)}...
              </Text>
              {order.lastErrorType === 'validation' && order.lastErrorMessage && (
                <Text className="text-red-600 text-xs text-right mt-2">{order.lastErrorMessage}</Text>
              )}
              {order.status === 'failed' && order.lastErrorType !== 'validation' && (
                <Text
                  className="text-blue-600 text-xs text-right mt-2"
                  onPress={() => retryOrder(order.id)}
                >
                  حدث خطأ في الإرسال. اضغط لإعادة المحاولة
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <EmptyState variant="orders" />
      )}
    </SafeAreaView>
  );
}
