import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
} from 'react-native';

import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button, Badge } from '@/components/ui';
import {
  useDelivery,
  useConfirmPickup,
  useStartDelivery,
  useCompleteDelivery,
  useFailDelivery,
} from '@/hooks/use-api';
import type { FailedDeliveryReason } from '@/lib/constants';
import { FAILED_DELIVERY_REASONS } from '@/lib/constants';
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
  orderStatusLabels,
  orderStatusColors,
  paymentMethodLabels,
} from '@/lib/formatters';
import type { MainStackParamList } from '@/navigation/MainNavigator';
import { useDeliveryStore } from '@/stores/delivery-store';

type RouteProps = RouteProp<MainStackParamList, 'DeliveryDetails'>;

interface DeliveryItem {
  id: string;
  product: { nameAr: string };
  quantity: number;
}

interface Delivery {
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
  paymentMethod?: string;
  createdAt: string;
  items: DeliveryItem[];
}

export function DeliveryDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { deliveryId } = route.params;

  const { data, isLoading, refetch } = useDelivery(deliveryId);
  const delivery = data as Delivery | undefined;

  const { isOffline: _isOffline } = useDeliveryStore();

  const confirmPickup = useConfirmPickup();
  const startDelivery = useStartDelivery();
  const completeDelivery = useCompleteDelivery();
  const failDelivery = useFailDelivery();

  const [showFailModal, setShowFailModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<FailedDeliveryReason | null>(null);
  const [failNotes, setFailNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);

  const handleCall = () => {
    if (delivery?.customerPhone) {
      Linking.openURL(`tel:${delivery.customerPhone}`);
    }
  };

  const handlePickup = () => {
    Alert.alert('تأكيد الاستلام', 'هل تم استلام الطلب من المتجر؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم، تم الاستلام',
        onPress: async () => {
          try {
            await confirmPickup.mutateAsync(deliveryId);
            refetch();
          } catch (error: any) {
            Alert.alert('خطأ', error.message);
          }
        },
      },
    ]);
  };

  const _handleStartDelivery = () => {
    Alert.alert('بدء التوصيل', 'هل أنت في الطريق إلى العميل الآن؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم، في الطريق',
        onPress: async () => {
          try {
            await startDelivery.mutateAsync(deliveryId);
            refetch();
          } catch (error: any) {
            Alert.alert('خطأ', error.message);
          }
        },
      },
    ]);
  };

  const handleComplete = () => {
    setShowNotesModal(true);
  };

  const confirmComplete = async () => {
    try {
      await completeDelivery.mutateAsync({
        orderId: deliveryId,
        notes: deliveryNotes.trim() || undefined,
      });
      setShowNotesModal(false);
      Alert.alert('تم', 'تم تسليم الطلب بنجاح', [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    }
  };

  const handleFail = () => {
    setShowFailModal(true);
  };

  const confirmFail = async () => {
    if (!selectedReason) {
      Alert.alert('خطأ', 'يرجى اختيار سبب الفشل');
      return;
    }

    if (selectedReason === 'OTHER' && !failNotes.trim()) {
      Alert.alert('خطأ', 'يرجى كتابة ملاحظة توضيحية');
      return;
    }

    try {
      await failDelivery.mutateAsync({
        orderId: deliveryId,
        reason: selectedReason,
        notes: failNotes.trim() || undefined,
      });
      setShowFailModal(false);
      Alert.alert('تم', 'تم تسجيل فشل التوصيل', [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    }
  };

  if (isLoading || !delivery) {
    return (
      <ScreenWrapper bgColor="#fff">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">جاري التحميل...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const statusColor = orderStatusColors[delivery.status] || { bg: '#f3f4f6', text: '#374151' };
  const isReady = delivery.status === 'READY';
  const isOutForDelivery = delivery.status === 'OUT_FOR_DELIVERY';

  return (
    <ScreenWrapper bgColor="#f3f4f6">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: statusColor.bg }}>
            <Text style={{ color: statusColor.text }} className="font-bold">
              {orderStatusLabels[delivery.status]}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-900 font-bold text-xl ml-3">
              طلب #{delivery.orderNumber}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center bg-gray-100 rounded-xl"
            >
              <Ionicons name="arrow-forward" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <OfflineBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#0ea5e9']}
            tintColor="#0ea5e9"
          />
        }
      >
        {/* Customer Info Card */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={handleCall}
              className="bg-primary w-12 h-12 rounded-full items-center justify-center"
            >
              <Ionicons name="call" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-1 mr-4">
              <Text className="text-gray-900 font-bold text-lg text-right">
                {delivery.customerName}
              </Text>
              <Text className="text-gray-500 text-right" dir="ltr">
                {formatPhone(delivery.customerPhone)}
              </Text>
            </View>
            <Ionicons name="person-circle-outline" size={40} color="#9ca3af" />
          </View>

          {/* Delivery Address */}
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center justify-end mb-2">
              <Text className="text-gray-700 font-bold mr-2">عنوان التوصيل</Text>
              <Ionicons name="location" size={20} color="#0ea5e9" />
            </View>
            <Text className="text-gray-900 text-right text-lg leading-7">
              {delivery.deliveryAddressText}
            </Text>
          </View>

          {delivery.notes && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <Text className="text-amber-600 text-right">ملاحظات العميل: {delivery.notes}</Text>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4">
          <Text className="text-gray-900 font-bold text-right mb-3">
            ملخص الطلب ({delivery.items?.length || 0} منتج)
          </Text>

          {delivery.items?.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between py-2 border-b border-gray-50"
            >
              <Text className="text-gray-500">{item.quantity}x</Text>
              <Text className="text-gray-700 flex-1 text-right mr-2">{item.product?.nameAr}</Text>
            </View>
          ))}

          <View className="mt-4 pt-4 border-t border-gray-200">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-900">{formatCurrency(delivery.subtotal)}</Text>
              <Text className="text-gray-500">المجموع الفرعي</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-900">{formatCurrency(delivery.deliveryFee)}</Text>
              <Text className="text-gray-500">رسوم التوصيل</Text>
            </View>
            <View className="h-px bg-gray-200 my-2" />
            <View className="flex-row justify-between">
              <Text className="text-primary text-xl font-bold">
                {formatCurrency(delivery.total)}
              </Text>
              <Text className="text-gray-900 font-bold">المجموع الكلي</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4">
          <View className="flex-row items-center justify-between">
            <Badge
              label={paymentMethodLabels[delivery.paymentMethod || 'COD']}
              variant={delivery.paymentMethod === 'COD' ? 'warning' : 'success'}
              size="lg"
            />
            <View className="flex-row items-center">
              <Text className="text-gray-700 font-bold mr-2">طريقة الدفع</Text>
              <Ionicons name="cash-outline" size={20} color="#6b7280" />
            </View>
          </View>
          {delivery.paymentMethod === 'COD' && (
            <Text className="text-amber-600 text-right mt-2 text-sm">
              يجب تحصيل {formatCurrency(delivery.total)} من العميل
            </Text>
          )}
        </View>

        {/* Order Date */}
        <View className="mx-4 mt-4 mb-4">
          <Text className="text-gray-400 text-center text-sm">
            تاريخ الطلب: {formatDateTime(delivery.createdAt)}
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 bg-white border-t border-gray-100">
        {isReady && (
          <Button
            title="تم استلام الطلب من المتجر"
            onPress={handlePickup}
            loading={confirmPickup.isPending}
            size="xl"
            fullWidth
            variant="success"
            icon={<Ionicons name="bag-check-outline" size={24} color="white" />}
          />
        )}

        {isOutForDelivery && (
          <View>
            <View className="flex-row mb-3">
              <Button
                title="فشل التوصيل"
                onPress={handleFail}
                size="lg"
                variant="danger"
                style={{ flex: 1, marginLeft: 8 }}
                icon={<Ionicons name="close-circle-outline" size={20} color="white" />}
              />
              <Button
                title="تم التسليم"
                onPress={handleComplete}
                loading={completeDelivery.isPending}
                size="lg"
                variant="success"
                style={{ flex: 1, marginRight: 8 }}
                icon={<Ionicons name="checkmark-circle-outline" size={20} color="white" />}
              />
            </View>
          </View>
        )}
      </View>

      {/* Failed Delivery Modal */}
      <Modal
        visible={showFailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFailModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <Text className="text-xl font-bold text-gray-900 text-right mb-6">سبب فشل التوصيل</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {FAILED_DELIVERY_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  className={`
                    flex-row items-center justify-between p-4 mb-3 rounded-xl border-2
                    ${selectedReason === reason.value ? 'border-danger bg-red-50' : 'border-gray-200'}
                  `}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <View
                    className={`
                      w-6 h-6 rounded-full border-2
                      ${selectedReason === reason.value ? 'border-danger bg-danger' : 'border-gray-300'}
                      items-center justify-center
                    `}
                  >
                    {selectedReason === reason.value && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text className="text-gray-900 font-medium text-lg">{reason.label}</Text>
                </TouchableOpacity>
              ))}

              <TextInput
                className="bg-gray-100 rounded-xl p-4 text-right text-gray-900 min-h-[100px]"
                placeholder="ملاحظات إضافية (مطلوبة إذا كان السبب 'سبب آخر')"
                placeholderTextColor="#9ca3af"
                value={failNotes}
                onChangeText={setFailNotes}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>

            <View className="flex-row mt-4">
              <Button
                title="إلغاء"
                variant="secondary"
                size="lg"
                onPress={() => {
                  setShowFailModal(false);
                  setSelectedReason(null);
                  setFailNotes('');
                }}
                style={{ flex: 1, marginLeft: 8 }}
              />
              <Button
                title="تأكيد الفشل"
                variant="danger"
                size="lg"
                onPress={confirmFail}
                loading={failDelivery.isPending}
                disabled={!selectedReason}
                style={{ flex: 1, marginRight: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delivery Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 text-right mb-4">تأكيد التسليم</Text>

            <TextInput
              className="bg-gray-100 rounded-xl p-4 text-right text-gray-900 min-h-[100px] mb-4"
              placeholder="ملاحظات التسليم (اختياري)"
              placeholderTextColor="#9ca3af"
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row">
              <Button
                title="إلغاء"
                variant="secondary"
                size="lg"
                onPress={() => {
                  setShowNotesModal(false);
                  setDeliveryNotes('');
                }}
                style={{ flex: 1, marginLeft: 8 }}
              />
              <Button
                title="تأكيد التسليم"
                variant="success"
                size="lg"
                onPress={confirmComplete}
                loading={completeDelivery.isPending}
                style={{ flex: 1, marginRight: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
