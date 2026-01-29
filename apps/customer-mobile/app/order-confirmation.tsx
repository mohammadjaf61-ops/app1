import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Package, Clock, Home, ClipboardList } from 'lucide-react-native';
import { View, Text, SafeAreaView, Pressable } from 'react-native';

import { formatCurrencyShort } from '../lib/formatters';
import { ORDER_STATUS_LABELS } from '../lib/constants';

export default function OrderConfirmationScreen() {
  const params = useLocalSearchParams<{
    orderId: string;
    orderNumber: string;
    total: string;
    itemCount: string;
  }>();

  const { orderNumber, total, itemCount } = params;

  const handleViewOrders = () => {
    router.replace('/tabs/orders');
  };

  const handleGoHome = () => {
    router.replace('/tabs/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        {/* Success Icon */}
        <View className="bg-green-100 w-24 h-24 rounded-full items-center justify-center mb-6">
          <CheckCircle size={56} color="#16a34a" />
        </View>

        {/* Success Message */}
        <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">تم الطلب بنجاح!</Text>
        <Text className="text-gray-500 text-center mb-8">سيتم التواصل معك قريباً لتأكيد الطلب</Text>

        {/* Order Details Card */}
        <View className="bg-gray-50 rounded-2xl p-6 w-full mb-8 border border-gray-200">
          {/* Order Number */}
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <Text className="text-primary font-bold text-lg">{orderNumber}</Text>
            <View className="flex-row items-center">
              <Text className="text-gray-500 ml-2">رقم الطلب</Text>
              <Package size={20} color="#6b7280" />
            </View>
          </View>

          {/* Order Status */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="bg-amber-100 px-3 py-1 rounded-full">
              <Text className="text-amber-700 font-medium">{ORDER_STATUS_LABELS.PENDING}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-500 ml-2">حالة الطلب</Text>
              <Clock size={20} color="#6b7280" />
            </View>
          </View>

          {/* Items Count */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-900 font-medium">{itemCount} منتج</Text>
            <Text className="text-gray-500">عدد المنتجات</Text>
          </View>

          {/* Total */}
          <View className="flex-row items-center justify-between pt-4 border-t border-gray-200">
            <Text className="text-primary text-xl font-bold">
              {formatCurrencyShort(Number(total))}
            </Text>
            <Text className="text-gray-900 font-bold">المجموع الكلي</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View className="bg-green-50 rounded-xl p-4 w-full mb-8 border border-green-200">
          <Text className="text-green-800 font-medium text-right mb-1">طريقة الدفع</Text>
          <Text className="text-green-700 text-right">الدفع عند الاستلام (نقداً)</Text>
        </View>

        {/* What's Next */}
        <View className="w-full mb-8">
          <Text className="text-gray-900 font-bold text-right mb-3">الخطوات التالية:</Text>
          <View className="flex-row items-start mb-2">
            <Text className="text-gray-600 text-right flex-1">
              سيتصل بك فريقنا لتأكيد الطلب والعنوان
            </Text>
            <Text className="text-primary font-bold w-6 text-center">١</Text>
          </View>
          <View className="flex-row items-start mb-2">
            <Text className="text-gray-600 text-right flex-1">
              سيتم تجهيز طلبك وإعداده للتوصيل
            </Text>
            <Text className="text-primary font-bold w-6 text-center">٢</Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-gray-600 text-right flex-1">
              سيصلك الطلب إلى عنوانك مع الدفع عند الاستلام
            </Text>
            <Text className="text-primary font-bold w-6 text-center">٣</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="w-full">
          <Pressable
            onPress={handleViewOrders}
            className="bg-primary py-4 rounded-xl flex-row items-center justify-center mb-3"
          >
            <Text className="text-white font-bold text-lg ml-2">متابعة الطلبات</Text>
            <ClipboardList size={20} color="white" />
          </Pressable>

          <Pressable
            onPress={handleGoHome}
            className="bg-gray-100 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Text className="text-gray-700 font-semibold text-lg ml-2">العودة للرئيسية</Text>
            <Home size={20} color="#374151" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
