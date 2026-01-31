import { Search, Plus, Package } from 'lucide-react-native';
import { View, Text, ScrollView, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';

import { MiniCartBar } from '../../../components/MiniCartBar';
import { ProductCardSkeleton } from '../../../components/ProductCardSkeleton';
import { StoreStatus } from '../../../components/StoreStatus';
import { useToast } from '../../../components/Toast';
import { useFeaturedProducts, useCategories, usePrefetchOnMount } from '../../../hooks/use-products';
import { Product } from '../../../lib/api';
import { formatCurrencyShort } from '../../../lib/formatters';
import { useCartStore } from '../../../stores/cart-store';
import { fontHeading, fontBody } from '../../../theme/typography';

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const { showToast } = useToast();

  const quantityInCart = getItemQuantity(product.id);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      sku: product.sku,
      nameAr: product.nameAr,
      price: product.price,
    });
    showToast(`تمت إضافة "${product.nameAr}" إلى السلة`, 'success');
  };

  return (
    <View className="w-[48%] bg-white rounded-xl p-3 mb-3 border border-gray-100 shadow-sm">
      <View className="h-24 bg-gray-100 rounded-lg mb-2 items-center justify-center">
        <Package size={32} color="#d1d5db" />
      </View>
      <Text style={{ fontFamily: fontBody }} className="text-gray-900 font-medium text-right" numberOfLines={1}>
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
        <Text className="text-primary font-bold">{formatCurrencyShort(product.price)}</Text>
      </View>
      {quantityInCart > 0 && (
        <View className="absolute top-2 left-2 bg-primary px-2 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">{quantityInCart}</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  usePrefetchOnMount();

  const { data: products, isLoading: productsLoading } = useFeaturedProducts();
  const { data: categories } = useCategories();

  const showSkeleton = productsLoading && !products;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <StoreStatus />
            <Text style={{ fontFamily: fontHeading }} className="text-2xl font-bold text-gray-900">مرحباً</Text>
          </View>
          <Text style={{ fontFamily: fontBody }} className="text-gray-500 text-right">ماذا تريد أن تشتري اليوم؟</Text>
        </View>

        {/* Search Bar */}
        <View className="bg-white px-4 py-3">
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Search size={20} color="#6b7280" />
            <TextInput
              className="flex-1 mr-3 text-right"
              placeholder="ابحث عن منتجات..."
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Categories */}
        <View className="bg-white px-4 py-4 mb-2">
          <Text style={{ fontFamily: fontHeading }} className="text-lg font-bold text-gray-900 mb-3 text-right">التصنيفات</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(categories || []).map((category) => (
              <TouchableOpacity
                key={category.id}
                className="bg-primary/10 rounded-xl px-4 py-3 ml-3"
                activeOpacity={0.7}
              >
                <Text className="text-primary font-medium">{category.nameAr}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View className="px-4 py-4">
          <Text style={{ fontFamily: fontHeading }} className="text-lg font-bold text-gray-900 mb-3 text-right">منتجات مميزة</Text>
          <View className="flex-row flex-wrap justify-between">
            {showSkeleton ? (
              <>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </>
            ) : (
              (products || []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </View>
        </View>

        {/* Info Banner */}
        <View className="mx-4 mb-24 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Text className="text-blue-800 font-semibold text-right mb-1">توصيل سريع</Text>
          <Text className="text-blue-700 text-sm text-right">
            اطلب الآن واحصل على طلبك خلال ساعات. الدفع عند الاستلام.
          </Text>
        </View>
      </ScrollView>

      <MiniCartBar />
    </SafeAreaView>
  );
}
