import { ClipboardList } from 'lucide-react-native';
import { View, Text, SafeAreaView } from 'react-native';

export default function OrdersScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">طلباتي</Text>
      </View>
      <View className="flex-1 justify-center items-center px-4">
        <ClipboardList size={64} color="#d1d5db" />
        <Text className="text-xl font-semibold text-gray-900 mt-4">لا توجد طلبات</Text>
        <Text className="text-gray-500 text-center mt-2">عند إتمام طلبك سيظهر هنا</Text>
      </View>
    </SafeAreaView>
  );
}
