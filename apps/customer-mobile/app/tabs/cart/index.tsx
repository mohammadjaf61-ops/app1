import { ShoppingCart } from 'lucide-react-native';
import { View, Text, SafeAreaView } from 'react-native';

export default function CartScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-4">
        <ShoppingCart size={64} color="#d1d5db" />
        <Text className="text-xl font-semibold text-gray-900 mt-4">سلتك فارغة</Text>
        <Text className="text-gray-500 text-center mt-2">ابدأ بإضافة منتجات إلى سلتك</Text>
      </View>
    </SafeAreaView>
  );
}
