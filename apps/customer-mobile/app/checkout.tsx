import { router } from 'expo-router';
import { Banknote, MapPin, User, Phone, FileText, AlertTriangle } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { useToast } from '../components/Toast';
import { useNetworkStatus } from '../hooks/use-network';
import { API_BASE_URL } from '../lib/constants';
import { formatCurrencyShort } from '../lib/formatters';
import { isStoreOpen, getDeliveryEta, getNextOpenTime } from '../lib/store-config';
import { useCartStore } from '../stores/cart-store';
import { useOrderQueueStore } from '../stores/order-queue-store';
import { useSettingsStore } from '../stores/settings-store';

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  multiline = false,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  error?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium text-right mb-2">{label}</Text>
      <View
        className={`flex-row items-center bg-gray-50 rounded-xl px-4 border ${
          error ? 'border-red-300' : 'border-gray-200'
        }`}
      >
        <View className="mr-3">{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          className={`flex-1 text-right py-4 text-gray-900 ${multiline ? 'min-h-[80px]' : ''}`}
          textAlign="right"
        />
      </View>
      {error && <Text className="text-red-500 text-sm text-right mt-1">{error}</Text>}
    </View>
  );
}

export default function CheckoutScreen() {
  const { showToast } = useToast();
  const {
    items,
    customerName,
    customerPhone,
    deliveryAddress,
    notes,
    setCustomerName,
    setCustomerPhone,
    setDeliveryAddress,
    setNotes,
    getSubtotal,
    getDeliveryFee,
    getTotal,
    clearCart,
  } = useCartStore();

  const { defaultAddress, savedName, savedPhone, setDefaultAddress, setSavedName, setSavedPhone } =
    useSettingsStore();

  const isConnected = useNetworkStatus();
  const addOrder = useOrderQueueStore((state) => state.addOrder);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isCheckingConsent, setIsCheckingConsent] = useState(false);

  // Initialize with saved/default values
  useEffect(() => {
    if (!deliveryAddress && defaultAddress) {
      setDeliveryAddress(defaultAddress);
    }
    if (!customerName && savedName) {
      setCustomerName(savedName);
    }
    if (!customerPhone && savedPhone) {
      setCustomerPhone(savedPhone);
    }
  }, []);

  // Check consent status when phone number changes
  const checkConsentStatus = useCallback(async (phone: string) => {
    if (!phone || !/^07\d{9}$/.test(phone)) {
      setHasConsent(null);
      return;
    }

    setIsCheckingConsent(true);
    try {
      const response = await fetch(`${API_BASE_URL}/consent/check?phone=${phone}`);
      if (response.ok) {
        const data = await response.json();
        setHasConsent(data.hasAcceptedAll);
      } else {
        // If API fails, assume consent needed for safety
        setHasConsent(false);
      }
    } catch (error) {
      console.error('Consent check error:', error);
      // If network error, allow proceeding but check again at submit
      setHasConsent(null);
    } finally {
      setIsCheckingConsent(false);
    }
  }, []);

  useEffect(() => {
    if (customerPhone) {
      checkConsentStatus(customerPhone);
    }
  }, [customerPhone, checkConsentStatus]);

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'يرجى إدخال الاسم';
    }

    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'يرجى إدخال رقم الهاتف';
    } else if (!/^07\d{9}$/.test(customerPhone.trim())) {
      newErrors.customerPhone = 'رقم الهاتف غير صحيح (07XXXXXXXXX)';
    }

    if (!deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'يرجى إدخال عنوان التوصيل';
    } else if (deliveryAddress.trim().length < 10) {
      newErrors.deliveryAddress = 'يرجى إدخال عنوان تفصيلي أكثر';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async () => {
    if (!validate()) {
      showToast('يرجى تصحيح الأخطاء', 'error');
      return;
    }

    if (items.length === 0) {
      showToast('السلة فارغة', 'warning');
      router.back();
      return;
    }

    // Check consent before submitting
    if (hasConsent === false) {
      showToast('يجب الموافقة على الشروط أولاً', 'warning');
      router.push({
        pathname: '/consent',
        params: { returnTo: '/checkout' },
      });
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        sku: item.sku,
        nameAr: item.nameAr,
        price: item.price,
        quantity: item.quantity,
      })),
      total,
    };

    // If offline, queue the order
    if (isConnected === false) {
      addOrder(orderPayload);
      setSavedName(customerName.trim());
      setSavedPhone(customerPhone.trim());
      setDefaultAddress(deliveryAddress.trim());
      clearCart();

      showToast('تم حفظ الطلب وسيُرسل تلقائياً عند توفر الإنترنت', 'info');
      router.replace('/tabs/orders');
      setIsSubmitting(false);
      return;
    }

    try {
      // Try to submit the order
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        throw new Error('API_ERROR');
      }

      const data = await response.json();

      // Save customer info for future orders
      setSavedName(customerName.trim());
      setSavedPhone(customerPhone.trim());
      setDefaultAddress(deliveryAddress.trim());

      // Clear cart after successful order
      clearCart();

      // Navigate to confirmation
      router.replace({
        pathname: '/order-confirmation',
        params: {
          orderId: data.id || `order-${Date.now()}`,
          orderNumber: data.orderNumber || `ORD-${Math.floor(Math.random() * 100000)}`,
          total: total.toString(),
          itemCount: items.reduce((sum, i) => sum + i.quantity, 0).toString(),
        },
      });
    } catch {
      // Network error - queue the order for retry
      addOrder(orderPayload);
      setSavedName(customerName.trim());
      setSavedPhone(customerPhone.trim());
      setDefaultAddress(deliveryAddress.trim());
      clearCart();

      showToast('سيتم إعادة المحاولة تلقائياً عند توفر الإنترنت', 'info');
      router.replace('/tabs/orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {/* Customer Info Section */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">
                معلومات العميل
              </Text>
              <InputField
                label="الاسم الكامل"
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="أدخل اسمك الكامل"
                icon={<User size={20} color="#6b7280" />}
                error={errors.customerName}
              />
              <InputField
                label="رقم الهاتف"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="07XX XXX XXXX"
                icon={<Phone size={20} color="#6b7280" />}
                keyboardType="phone-pad"
                error={errors.customerPhone}
              />
            </View>

            {/* Delivery Address Section */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">عنوان التوصيل</Text>
              <InputField
                label="العنوان التفصيلي"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="المنطقة، الشارع، أقرب نقطة دالة..."
                icon={<MapPin size={20} color="#6b7280" />}
                multiline
                error={errors.deliveryAddress}
              />
            </View>

            {/* Notes Section */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">
                ملاحظات (اختياري)
              </Text>
              <InputField
                label="تعليمات خاصة"
                value={notes}
                onChangeText={setNotes}
                placeholder="أي تعليمات خاصة للطلب..."
                icon={<FileText size={20} color="#6b7280" />}
                multiline
              />
            </View>

            {/* Payment Method */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">طريقة الدفع</Text>
              <View className="bg-green-50 border border-green-200 p-4 rounded-xl flex-row items-center">
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-right">الدفع عند الاستلام</Text>
                  <Text className="text-gray-500 text-sm text-right">
                    ادفع نقداً عند استلام الطلب
                  </Text>
                </View>
                <View className="bg-green-100 w-12 h-12 rounded-full items-center justify-center">
                  <Banknote size={24} color="#16a34a" />
                </View>
              </View>
            </View>

            {/* Consent Status */}
            {customerPhone && /^07\d{9}$/.test(customerPhone) && (
              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 text-right mb-4">
                  الموافقة على الشروط
                </Text>
                {isCheckingConsent ? (
                  <View className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="#6b7280" />
                    <Text className="text-gray-600 mr-2">جاري التحقق...</Text>
                  </View>
                ) : hasConsent === true ? (
                  <View className="bg-green-50 border border-green-200 p-4 rounded-xl flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-green-800 font-semibold text-right">
                        تمت الموافقة على الشروط ✓
                      </Text>
                      <Text className="text-green-600 text-sm text-right">يمكنك إتمام الطلب</Text>
                    </View>
                  </View>
                ) : hasConsent === false ? (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/consent',
                        params: { returnTo: '/checkout' },
                      })
                    }
                    className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex-row items-center"
                  >
                    <View className="flex-1">
                      <Text className="text-amber-800 font-semibold text-right">
                        مطلوب الموافقة على الشروط
                      </Text>
                      <Text className="text-amber-600 text-sm text-right">
                        اضغط هنا للموافقة قبل إتمام الطلب
                      </Text>
                    </View>
                    <AlertTriangle size={24} color="#d97706" />
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* Delivery ETA */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">وقت التوصيل</Text>
              <View className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <Text className="text-blue-800 font-semibold text-right">
                  وقت التوصيل المتوقع: {getDeliveryEta().text}
                </Text>
                <Text className="text-blue-600 text-sm text-right mt-1">
                  بعد تأكيد الطلب مباشرة
                </Text>
              </View>
            </View>

            {/* Order Summary */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 text-right mb-4">ملخص الطلب</Text>
              <View className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                {/* Items Summary */}
                <View className="mb-3">
                  {items.slice(0, 3).map((item) => (
                    <View key={item.productId} className="flex-row justify-between mb-1">
                      <Text className="text-gray-700">
                        {formatCurrencyShort(item.price * item.quantity)}
                      </Text>
                      <Text className="text-gray-600 flex-1 text-right mr-2" numberOfLines={1}>
                        {item.nameAr} × {item.quantity}
                      </Text>
                    </View>
                  ))}
                  {items.length > 3 && (
                    <Text className="text-gray-500 text-sm text-right">
                      و {items.length - 3} منتجات أخرى...
                    </Text>
                  )}
                </View>

                <View className="h-px bg-gray-200 my-3" />

                {/* Totals */}
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-900">{formatCurrencyShort(subtotal)}</Text>
                  <Text className="text-gray-500">المنتجات ({items.length})</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-900">{formatCurrencyShort(deliveryFee)}</Text>
                  <Text className="text-gray-500">رسوم التوصيل</Text>
                </View>
                <View className="h-px bg-gray-300 my-3" />
                <View className="flex-row justify-between">
                  <Text className="text-primary text-xl font-bold">
                    {formatCurrencyShort(total)}
                  </Text>
                  <Text className="text-gray-900 font-bold text-lg">المجموع الكلي</Text>
                </View>
              </View>
            </View>

            {/* Warning for large orders */}
            {items.length > 10 && (
              <View className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex-row items-center mb-6">
                <View className="flex-1 mr-3">
                  <Text className="text-amber-800 text-sm text-right">
                    طلبك يحتوي على {items.length} منتج. قد يستغرق التجهيز وقتاً أطول.
                  </Text>
                </View>
                <AlertTriangle size={24} color="#d97706" />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View className="p-4 bg-white border-t border-gray-100 shadow-lg">
          {!isStoreOpen() && (
            <View className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-3">
              <Text className="text-amber-700 text-center font-medium">
                المتجر مغلق حالياً • يفتح {getNextOpenTime()}
              </Text>
            </View>
          )}
          <Pressable
            onPress={handleSubmitOrder}
            disabled={isSubmitting || !isStoreOpen()}
            className={`py-4 rounded-xl flex-row items-center justify-center ${
              isSubmitting || !isStoreOpen() ? 'bg-gray-400' : 'bg-primary'
            }`}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-bold text-lg mr-2">جاري إرسال الطلب...</Text>
              </>
            ) : (
              <Text className="text-white font-bold text-lg">
                {isStoreOpen() ? 'تأكيد الطلب' : 'المتجر مغلق'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
