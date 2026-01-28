import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import type { Product, Category } from '@hypermarket/contracts';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ProductCard } from '@/components/ui';
import { useCategories, useProducts } from '@/hooks/use-api';
import { RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CategoriesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: productsData, isLoading: productsLoading } = useProducts({
    categoryId: selectedCategory || undefined,
    limit: 20,
  });

  const products: Product[] = productsData?.data || [];

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 text-right">
          الأقسام
        </Text>
      </View>

      <View className="flex-1 flex-row">
        {/* Categories Sidebar */}
        <View className="w-24 bg-white border-l border-gray-100">
          <FlatList<Category>
            data={categories || []}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <TouchableOpacity
                className={`p-3 items-center border-b border-gray-100 ${
                  !selectedCategory ? 'bg-primary/10' : ''
                }`}
                onPress={() => setSelectedCategory(null)}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mb-1 ${
                    !selectedCategory ? 'bg-primary' : 'bg-gray-100'
                  }`}
                >
                  <Ionicons
                    name="apps-outline"
                    size={24}
                    color={!selectedCategory ? 'white' : '#9ca3af'}
                  />
                </View>
                <Text
                  className={`text-xs text-center ${
                    !selectedCategory ? 'text-primary font-bold' : 'text-gray-600'
                  }`}
                  numberOfLines={2}
                >
                  الكل
                </Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`p-3 items-center border-b border-gray-100 ${
                  selectedCategory === item.id ? 'bg-primary/10' : ''
                }`}
                onPress={() => setSelectedCategory(item.id)}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mb-1 ${
                    selectedCategory === item.id ? 'bg-primary' : 'bg-gray-100'
                  }`}
                >
                  <Ionicons
                    name="cube-outline"
                    size={24}
                    color={selectedCategory === item.id ? 'white' : '#9ca3af'}
                  />
                </View>
                <Text
                  className={`text-xs text-center ${
                    selectedCategory === item.id
                      ? 'text-primary font-bold'
                      : 'text-gray-600'
                  }`}
                  numberOfLines={2}
                >
                  {item.nameAr}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Products Grid */}
        <View className="flex-1 bg-gray-50">
          {productsLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          ) : (
            <FlatList<Product>
              data={products}
              keyExtractor={(item) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              ItemSeparatorComponent={() => <View className="h-3" />}
              renderItem={({ item }) => (
                <View className="w-[48%]">
                  <ProductCard
                    product={item}
                    onPress={() =>
                      navigation.navigate('Product', { productId: item.id })
                    }
                  />
                </View>
              )}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-20">
                  <Ionicons name="cube-outline" size={48} color="#9ca3af" />
                  <Text className="text-gray-400 mt-4">لا توجد منتجات</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}
