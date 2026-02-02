import { useCartSyncStore, useNetworkStatus } from '@hypermarket/mobile-core';
import { Search, Plus, Package } from 'lucide-react-native';
import { useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '@hypermarket/design-tokens';

import { EmptyState } from '../../../components/EmptyState';
import { MiniCartBar } from '../../../components/MiniCartBar';
import { ProductCardSkeleton } from '../../../components/ProductCardSkeleton';
import { StoreStatus } from '../../../components/StoreStatus';
import { useToast } from '../../../components/Toast';
import { useFeaturedProducts, useCategories, usePrefetchOnMount } from '../../../hooks/use-products';
import { Product } from '../../../lib/api';
import { formatCurrencyShort } from '../../../lib/formatters';
import { markHomeFirstRender } from '../../../lib/performance';
import { useCartStore } from '../../../stores/cart-store';
import { fontHeading, fontBody } from '../../../theme/typography';

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const enqueueAdd = useCartSyncStore((state) => state.enqueueAdd);
  const { showToast } = useToast();

  const quantityInCart = getItemQuantity(product.id);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      sku: product.sku,
      nameAr: product.nameAr,
      price: product.price,
    });
    enqueueAdd({
      productId: product.id,
      sku: product.sku,
      quantity: 1,
    });
    showToast(`تمت إضافة "${product.nameAr}" إلى السلة`, 'success');
  };

  return (
    <View className="w-[48%] bg-white dark:bg-primary-900/50 rounded-xl p-3 mb-3 border border-gray-100 dark:border-primary-800 shadow-sm">
      <View className="h-24 bg-gray-100 dark:bg-primary-800/50 rounded-lg mb-2 items-center justify-center">
        <Package size={32} color={colors.text.disabled} />
      </View>
      <Text
        style={{ fontFamily: fontBody }}
        className="text-gray-900 dark:text-gray-100 font-medium text-right"
        numberOfLines={1}
      >
        {product.nameAr}
      </Text>
      <View className="flex-row items-center justify-between mt-2">
        <TouchableOpacity
          onPress={handleAddToCart}
          className="bg-primary w-8 h-8 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <Plus size={18} color="white" />
        </TouchableOpacity>
        <Text className="text-primary dark:text-primary-200 font-bold">
          {formatCurrencyShort(product.price)}
        </Text>
      </View>
      {quantityInCart > 0 && (
        <View className="absolute top-2 left-2 bg-primary dark:bg-primary-600 px-2 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">{quantityInCart}</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  usePrefetchOnMount();
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    markHomeFirstRender();
  }, []);

  const {
    data: products,
    isLoading: productsLoading,
    isHydrating: productsHydrating,
    isError: productsError,
    refetch: refetchProducts,
    isRefetching,
  } = useFeaturedProducts();
  const { data: categories, isHydrating: categoriesHydrating } = useCategories();

  const isProductsLoading = (productsLoading || productsHydrating) && !products;
  const isCategoriesLoading = categoriesHydrating && !(categories && categories.length > 0);
  const showSkeleton = isProductsLoading;
  const showEmptyProducts = !isProductsLoading && (!products || products.length === 0);
  const showOffline = isOffline && !products;
  const showError = productsError && !products;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-primary-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white dark:bg-primary-900 px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <StoreStatus />
            <Text
              style={{ fontFamily: fontHeading }}
              className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            >
              مرحباً
            </Text>
          </View>
          <Text
            style={{ fontFamily: fontBody }}
            className="text-gray-500 dark:text-gray-300 text-right"
          >
            ماذا تريد أن تشتري اليوم؟
          </Text>
        </View>

        {/* Search Bar */}
        <View className="bg-white dark:bg-primary-900 px-4 py-3">
          <View className="flex-row items-center bg-gray-100 dark:bg-primary-800/60 rounded-xl px-4 py-3">
            <Search size={20} color={colors.text.secondary} />
            <TextInput
              className="flex-1 mr-3 text-right text-gray-900 dark:text-gray-100"
              placeholder="ابحث عن منتجات..."
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </View>

        {/* Categories */}
        <View className="bg-white dark:bg-primary-900 px-4 py-4 mb-2">
          <Text
            style={{ fontFamily: fontHeading }}
            className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 text-right"
          >
            التصنيفات
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(categories || []).map((category) => (
              <TouchableOpacity
                key={category.id}
                className="bg-primary/10 dark:bg-primary-700/30 rounded-xl px-4 py-3 ml-3"
                activeOpacity={0.7}
              >
                <Text className="text-primary dark:text-primary-200 font-medium">
                  {category.nameAr}
                </Text>
              </TouchableOpacity>
            ))}
            {isCategoriesLoading && (
              <View className="bg-gray-100 dark:bg-primary-800/60 rounded-xl px-8 py-3 ml-3" />
            )}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View className="px-4 py-4">
          <Text
            style={{ fontFamily: fontHeading }}
            className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 text-right"
          >
            منتجات مميزة
          </Text>

          {/* Offline State */}
          {showOffline && (
            <EmptyState
              variant="offline"
              onRetry={() => refetchProducts()}
              isRetrying={isRefetching}
            />
          )}

          {/* Error State */}
          {showError && !showOffline && (
            <EmptyState
              variant="error"
              onRetry={() => refetchProducts()}
              isRetrying={isRefetching}
            />
          )}

          {/* Empty Products State */}
          {showEmptyProducts && !showOffline && !showError && (
            <View className="py-8">
              <EmptyState
                variant="products"
                description="لا توجد منتجات متوفرة حالياً، يرجى المحاولة لاحقاً"
              />
            </View>
          )}

          {/* Loading Skeleton */}
          {showSkeleton && (
            <View className="flex-row flex-wrap justify-between">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </View>
          )}

          {/* Products Grid */}
          {!showSkeleton && !showEmptyProducts && !showOffline && !showError && products && (
            <View className="flex-row flex-wrap justify-between">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
          )}
        </View>

        {/* Info Banner */}
        <View className="mx-4 mb-24 bg-blue-50 dark:bg-primary-800/60 border border-blue-200 dark:border-primary-700 rounded-xl p-4">
          <Text className="text-blue-800 dark:text-gray-100 font-semibold text-right mb-1">
            توصيل سريع
          </Text>
          <Text className="text-blue-700 dark:text-gray-200 text-sm text-right">
            اطلب الآن واحصل على طلبك خلال ساعات. الدفع عند الاستلام.
          </Text>
        </View>
      </ScrollView>

      <MiniCartBar />
    </SafeAreaView>
  );
}
