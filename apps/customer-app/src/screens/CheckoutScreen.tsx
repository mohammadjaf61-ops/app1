import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, useNetworkStatus } from '@hypermarket/mobile-core';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';

import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { Button, Input } from '@/components/ui';
import { useCreateOrder } from '@/hooks/use-api';
import { formatCurrencyShort } from '@/lib/formatters';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { useSyncQueue } from '@/stores/sync-queue';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { isOffline } = useNetworkStatus();
  const { items, deliveryAddress, notes, setDeliveryAddress, setNotes, clearCart } = useCartStore();
  const { saveDraftOrder, draftOrders } = useSyncQueue();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 5000;
  const total = subtotal + deliveryFee;

  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(deliveryAddress);
  const [orderNotes, setOrderNotes] = useState(notes);

  const createOrder = useCreateOrder();

  const handleConfirmOrder = async () => {
    // Validation
    if (!customerName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      Alert.alert('خطأ', 'يرجى إدخال رقم هاتف صحيح');
      return;
    }
    if (!address.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان التوصيل');
      return;
    }

    // Handle offline: save draft order
    if (isOffline) {
      saveDraftOrder({
        items: items.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          nameAr: item.nameAr,
          price: item.price,
          quantity: item.quantity,
        })),
        deliveryAddress: address.trim(),
        notes: orderNotes.trim(),
        total,
      });

      // Clear cart after saving draft
      clearCart();

      Alert.alert(
        'تم حفظ الطلب',
        'لا يوجد اتصال. تم حفظ الطلب وسيُرسل تلقائيًا عند عودة الشبكة.',
        [
          {
            text: 'حسناً',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            },
          },
        ],
      );
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddressText: address.trim(),
        notes: orderNotes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      // Clear cart after successful order
      clearCart();

      // Show success and navigate
      Alert.alert('تم الطلب بنجاح!', `رقم الطلب: ${order.orderNumber}\nسيتم التواصل معك قريباً`, [
        {
          text: 'متابعة الطلب',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }, { name: 'OrderDetails', params: { orderId: order.id } }],
            });
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في إنشاء الطلب');
    }
  };

  return (
    <ScreenWrapper bgColor="#fff">
      {/* Offline Banner */}
      <OfflineBanner showCacheMessage={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {/* Offline Notice */}
            {isOffline && (
              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex-row items-center">
                <View className="flex-1 mr-3">
                  <Text className="text-blue-800 font-bold text-right mb-1">
                    أنت غير متصل بالإنترنت
                  </Text>
                  <Text className="text-blue-700 text-sm text-right">
                    يمكنك إتمام الطلب وسيتم حفظه تلقائيًا. سيُرسل الطلب فور عودة الاتصال.
                  </Text>
                </View>
                <Ionicons name="cloud-offline-outline" size={32} color="#1d4ed8" />
              </View>
            )}

            {/* Pending Draft Orders Notice */}
            {draftOrders.length > 0 && (
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex-row items-center">
                <View className="flex-1 mr-3">
                  <Text className="text-amber-800 font-bold text-right mb-1">
                    لديك {draftOrders.length} طلب محفوظ
                  </Text>
                  <Text className="text-amber-700 text-sm text-right">
                    سيتم إرسال الطلبات المحفوظة تلقائيًا عند عودة الاتصال.
                  </Text>
                </View>
                <Ionicons name="time-outline" size={32} color="#b45309" />
              </View>
            )}

            {/* Customer Info */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">
                معلومات العميل
              </Text>
              <Input
                label="الاسم الكامل"
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="أدخل اسمك"
              />
              <View className="h-3" />
              <Input
                label="رقم الهاتف"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="07XX XXX XXXX"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            {/* Delivery Address */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">عنوان التوصيل</Text>
              <Input
                label="العنوان التفصيلي"
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  setDeliveryAddress(text);
                }}
                placeholder="المنطقة، الشارع، أقرب نقطة دالة..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Notes */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">
                ملاحظات (اختياري)
              </Text>
              <Input
                value={orderNotes}
                onChangeText={(text) => {
                  setOrderNotes(text);
                  setNotes(text);
                }}
                placeholder="أي تعليمات خاصة للطلب..."
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Payment Method */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">طريقة الدفع</Text>
              <View className="bg-gray-50 p-4 rounded-xl flex-row items-center">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium text-right">الدفع عند الاستلام</Text>
                  <Text className="text-gray-500 text-sm text-right">
                    ادفع نقداً عند استلام الطلب
                  </Text>
                </View>
                <View className="bg-primary/10 w-12 h-12 rounded-full items-center justify-center">
                  <Ionicons name="cash-outline" size={24} color="#16a34a" />
                </View>
              </View>
            </View>

            {/* Order Summary */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">ملخص الطلب</Text>
              <View className="bg-gray-50 p-4 rounded-xl">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-900">{formatCurrencyShort(subtotal)}</Text>
                  <Text className="text-gray-500">المنتجات ({items.length})</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-900">{formatCurrencyShort(deliveryFee)}</Text>
                  <Text className="text-gray-500">رسوم التوصيل</Text>
                </View>
                <View className="h-px bg-gray-200 my-3" />
                <View className="flex-row justify-between">
                  <Text className="text-primary text-lg font-bold">
                    {formatCurrencyShort(total)}
                  </Text>
                  <Text className="text-gray-900 font-bold">المجموع الكلي</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View className="p-4 bg-white border-t border-gray-100">
          <Button
            title={isOffline ? 'حفظ الطلب (سيُرسل عند الاتصال)' : 'تأكيد الطلب'}
            onPress={handleConfirmOrder}
            loading={createOrder.isPending}
            fullWidth
            size="lg"
            icon={
              <Ionicons
                name={isOffline ? 'save-outline' : 'checkmark-circle-outline'}
                size={20}
                color="white"
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
