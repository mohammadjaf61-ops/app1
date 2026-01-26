import { View, Text, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">مرحباً</Text>
          <Text className="text-gray-500">ماذا تريد أن تشتري اليوم؟</Text>
        </View>

        {/* Search Bar */}
        <View className="px-4 py-3">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
            <Search size={20} color="#6b7280" />
            <TextInput
              className="flex-1 mr-3 text-right"
              placeholder="ابحث عن منتجات..."
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Categories */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            التصنيفات
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['فواكه', 'خضروات', 'ألبان', 'مشروبات', 'معلبات'].map(
              (category, index) => (
                <View
                  key={index}
                  className="bg-primary/10 rounded-lg px-4 py-3 ml-3"
                >
                  <Text className="text-primary font-medium">{category}</Text>
                </View>
              ),
            )}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            منتجات مميزة
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((item) => (
              <View
                key={item}
                className="w-[48%] bg-gray-50 rounded-lg p-3 mb-3"
              >
                <View className="h-24 bg-gray-200 rounded-lg mb-2" />
                <Text className="text-gray-900 font-medium">اسم المنتج</Text>
                <Text className="text-primary font-semibold">٢,٥٠٠ د.ع</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
