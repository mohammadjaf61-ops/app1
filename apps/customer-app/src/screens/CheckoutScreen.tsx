import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useNetworkStatus } from '@hypermarket/mobile-core';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button, Input } from '@/components/ui';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useCreateOrder } from '@/hooks/use-api';
import { formatCurrencyShort } from '@/lib/formatters';
import { RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { items, deliveryAddress, notes, setDeliveryAddress, setNotes, clearCart } = useCartStore();
  const { isOffline } = useNetworkStatus();

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
      Alert.alert(
        'تم الطلب بنجاح!',
        `رقم الطلب: ${order.orderNumber}\nسيتم التواصل معك قريباً`,
        [
          {
            text: 'متابعة الطلب',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'Main' },
                  { name: 'OrderDetails', params: { orderId: order.id } },
                ],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في إنشاء الطلب');
    }
  };

  return (
    <ScreenWrapper bgColor="#fff">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
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
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">
                عنوان التوصيل
              </Text>
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
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">
                طريقة الدفع
              </Text>
              <View className="bg-gray-50 p-4 rounded-xl flex-row items-center">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium text-right">
                    الدفع عند الاستلام
                  </Text>
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
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">
                ملخص الطلب
              </Text>
              <View className="bg-gray-50 p-4 rounded-xl">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-900">{formatCurrencyShort(subtotal)}</Text>
                  <Text className="text-gray-500">
                    المنتجات ({items.length})
                  </Text>
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

        {/* Offline Warning */}
        {isOffline && (
          <View className="mx-4 mb-4 bg-amber-50 p-4 rounded-xl flex-row items-center">
            <View className="flex-1">
              <Text className="text-amber-800 font-medium text-right">لا يمكن إتمام الطلب</Text>
              <Text className="text-amber-600 text-sm text-right">
                يرجى الاتصال بالإنترنت لإتمام عملية الشراء
              </Text>
            </View>
            <View className="bg-amber-100 w-10 h-10 rounded-full items-center justify-center mr-3">
              <Ionicons name="wifi-outline" size={20} color="#d97706" />
            </View>
          </View>
        )}

        {/* Confirm Button */}
        <View className="p-4 bg-white border-t border-gray-100">
          <Button
            title={isOffline ? 'غير متصل بالإنترنت' : 'تأكيد الطلب'}
            onPress={handleConfirmOrder}
            loading={createOrder.isPending}
            disabled={isOffline}
            fullWidth
            size="lg"
            icon={
              <Ionicons
                name={isOffline ? 'cloud-offline-outline' : 'checkmark-circle-outline'}
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
