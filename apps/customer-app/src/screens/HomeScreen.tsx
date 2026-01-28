import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
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

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useProducts({ limit: 10 });

  const products: Product[] = productsData?.data || [];
  const isLoading = categoriesLoading || productsLoading;

  const onRefresh = () => {
    refetchCategories();
    refetchProducts();
  };

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-primary px-4 pt-12 pb-6 rounded-b-3xl">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity className="bg-white/20 p-2 rounded-full">
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-row items-center">
              <Text className="text-white font-bold text-lg ml-2">
                هايبرماركت
              </Text>
              <Ionicons name="storefront" size={24} color="white" />
            </View>
          </View>

          {/* Location */}
          <TouchableOpacity className="flex-row items-center justify-end mb-4">
            <Text className="text-white/80 text-sm ml-1">التوصيل إلى:</Text>
            <Ionicons name="location-outline" size={16} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-medium text-right">
            بغداد، المنصور
          </Text>

          {/* Search Bar */}
          <TouchableOpacity
            className="bg-white flex-row items-center px-4 py-3 rounded-xl mt-4"
            onPress={() => navigation.navigate('Search')}
          >
            <Text className="flex-1 text-gray-400 text-right">
              ابحث عن المنتجات...
            </Text>
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View className="px-4 py-6">
          {/* Categories */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity>
                <Text className="text-primary font-medium">عرض الكل</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900">الأقسام</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 8 }}
              className="flex-row-reverse"
            >
              {(categories || []).slice(0, 8).map((category: Category) => (
                <TouchableOpacity
                  key={category.id}
                  className="items-center ml-4"
                  onPress={() => {}}
                >
                  <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mb-2">
                    <Ionicons name="cube-outline" size={28} color="#16a34a" />
                  </View>
                  <Text className="text-gray-700 text-xs text-center" numberOfLines={2}>
                    {category.nameAr}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Offers Banner */}
          <TouchableOpacity className="bg-secondary-500 rounded-2xl p-4 mb-6 flex-row items-center">
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">
                عروض اليوم
              </Text>
              <Text className="text-white/80 text-sm">
                خصومات تصل إلى 30%
              </Text>
            </View>
            <View className="bg-white/20 p-3 rounded-full">
              <Ionicons name="gift-outline" size={32} color="white" />
            </View>
          </TouchableOpacity>

          {/* Products */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity>
                <Text className="text-primary font-medium">عرض الكل</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900">
                منتجات مميزة
              </Text>
            </View>
            <FlatList<Product>
              data={products}
              horizontal
              showsHorizontalScrollIndicator={false}
              inverted // For RTL
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingLeft: 8 }}
              ItemSeparatorComponent={() => <View className="w-3" />}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('Product', { productId: item.id })}
                />
              )}
              ListEmptyComponent={
                <View className="w-full items-center py-8">
                  <Text className="text-gray-400">لا توجد منتجات</Text>
                </View>
              }
            />
          </View>

          {/* More Products */}
          <View>
            <Text className="text-lg font-bold text-gray-900 text-right mb-4">
              تسوق الآن
            </Text>
            {products.slice(0, 5).map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                variant="horizontal"
                onPress={() => navigation.navigate('Product', { productId: item.id })}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
