import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ProductCard } from '@/components/ui';
import { useSearchProducts } from '@/hooks/use-api';
import { RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useSearchProducts(debouncedQuery);
  const products = (data as any)?.data || data || [];

  const recentSearches = ['حليب', 'خبز', 'بيض', 'جبن', 'زيت']; // Mock recent searches

  return (
    <ScreenWrapper bgColor="#fff">
      {/* Search Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 ml-2"
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4">
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 py-3 mr-2 text-right text-base"
              placeholder="ابحث عن المنتجات..."
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      {query.length < 2 ? (
        // Recent Searches
        <View className="p-4">
          <Text className="text-gray-900 font-bold text-right mb-4">
            عمليات البحث الأخيرة
          </Text>
          <View className="flex-row flex-wrap justify-end">
            {recentSearches.map((term, index) => (
              <TouchableOpacity
                key={index}
                className="bg-gray-100 px-4 py-2 rounded-full ml-2 mb-2"
                onPress={() => setQuery(term)}
              >
                <Text className="text-gray-700">{term}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-gray-900 font-bold text-right mt-6 mb-4">
            اقتراحات
          </Text>
          {['منتجات طازجة', 'عروض اليوم', 'مشروبات', 'حلويات'].map(
            (suggestion, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center py-3 border-b border-gray-100"
                onPress={() => setQuery(suggestion)}
              >
                <Ionicons name="trending-up-outline" size={20} color="#9ca3af" />
                <Text className="flex-1 text-gray-700 text-right mr-3">
                  {suggestion}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      ) : isLoading ? (
        // Loading
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">جاري البحث...</Text>
        </View>
      ) : products.length > 0 ? (
        // Results
        <FlatList
          data={products}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text className="text-gray-500 text-right mb-4">
              {products.length} نتيجة
            </Text>
          }
          renderItem={({ item }: any) => (
            <ProductCard
              product={item}
              variant="horizontal"
              onPress={() => navigation.navigate('Product', { productId: item.id })}
            />
          )}
        />
      ) : (
        // No Results
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="search-outline" size={48} color="#9ca3af" />
          <Text className="text-gray-900 font-bold text-lg mt-4">
            لا توجد نتائج
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            جرب البحث بكلمات مختلفة
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}
