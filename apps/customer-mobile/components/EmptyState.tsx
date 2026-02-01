import { router } from 'expo-router';
import {
  Package,
  Search,
  ShoppingCart,
  ClipboardList,
  WifiOff,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';

type EmptyStateVariant =
  | 'products'
  | 'categories'
  | 'search'
  | 'cart'
  | 'orders'
  | 'offline'
  | 'error';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  searchQuery?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  ctaLabel?: string;
  ctaAction?: () => void;
}

const EMPTY_STATE_CONFIG: Record<
  EmptyStateVariant,
  {
    icon: typeof Package;
    iconColor: string;
    bgColor: string;
    defaultTitle: string;
    defaultDescription: string;
    defaultCta?: { label: string; route: string };
  }
> = {
  products: {
    icon: Package,
    iconColor: '#9ca3af',
    bgColor: 'bg-gray-100',
    defaultTitle: 'لا توجد منتجات',
    defaultDescription: 'لم نجد منتجات في هذا التصنيف حالياً',
    defaultCta: { label: 'تصفح التصنيفات', route: '/tabs/home' },
  },
  categories: {
    icon: Package,
    iconColor: '#9ca3af',
    bgColor: 'bg-gray-100',
    defaultTitle: 'لا توجد تصنيفات',
    defaultDescription: 'التصنيفات غير متوفرة حالياً',
  },
  search: {
    icon: Search,
    iconColor: '#9ca3af',
    bgColor: 'bg-gray-100',
    defaultTitle: 'لا توجد نتائج',
    defaultDescription: 'جرّب كلمات بحث مختلفة أو تصفح التصنيفات',
    defaultCta: { label: 'تصفح التصنيفات', route: '/tabs/home' },
  },
  cart: {
    icon: ShoppingCart,
    iconColor: '#9ca3af',
    bgColor: 'bg-gray-100',
    defaultTitle: 'سلتك فارغة',
    defaultDescription: 'أضف منتجات من المتجر لتبدأ التسوق',
    defaultCta: { label: 'تصفح المنتجات', route: '/tabs/home' },
  },
  orders: {
    icon: ClipboardList,
    iconColor: '#d1d5db',
    bgColor: 'bg-gray-100',
    defaultTitle: 'لا توجد طلبات بعد',
    defaultDescription: 'طلباتك ستظهر هنا بعد إتمام أول طلب',
    defaultCta: { label: 'ابدأ أول طلب', route: '/tabs/home' },
  },
  offline: {
    icon: WifiOff,
    iconColor: '#f59e0b',
    bgColor: 'bg-amber-100',
    defaultTitle: 'لا يوجد اتصال',
    defaultDescription: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
  },
  error: {
    icon: AlertCircle,
    iconColor: '#ef4444',
    bgColor: 'bg-red-100',
    defaultTitle: 'حدث خطأ',
    defaultDescription: 'تعذر تحميل البيانات، حاول مرة أخرى',
  },
};

export function EmptyState({
  variant,
  title,
  description,
  searchQuery,
  onRetry,
  isRetrying,
  ctaLabel,
  ctaAction,
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[variant];
  const IconComponent = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayDescription =
    description ||
    (variant === 'search' && searchQuery
      ? `لم نجد نتائج لـ "${searchQuery}"`
      : config.defaultDescription);

  const handleCta = () => {
    if (ctaAction) {
      ctaAction();
    } else if (config.defaultCta) {
      router.push(config.defaultCta.route as never);
    }
  };

  const showCta = ctaAction || config.defaultCta;
  const ctaText = ctaLabel || config.defaultCta?.label;

  return (
    <View className="flex-1 justify-center items-center px-6 py-8">
      <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${config.bgColor}`}>
        <IconComponent size={40} color={config.iconColor} />
      </View>

      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">{displayTitle}</Text>

      <Text className="text-gray-500 text-center mb-6 leading-6">{displayDescription}</Text>

      {/* Retry Button for offline/error states */}
      {(variant === 'offline' || variant === 'error') && onRetry && (
        <Pressable
          onPress={onRetry}
          disabled={isRetrying}
          className={`flex-row items-center bg-gray-100 px-5 py-3 rounded-xl mb-3 ${
            isRetrying ? 'opacity-60' : ''
          }`}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <RefreshCw size={18} color="#4f46e5" />
          )}
          <Text className="text-primary font-medium mr-2">
            {isRetrying ? 'جاري المحاولة...' : 'إعادة المحاولة'}
          </Text>
        </Pressable>
      )}

      {/* CTA Button */}
      {showCta && ctaText && (
        <Pressable onPress={handleCta} className="bg-primary px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">{ctaText}</Text>
        </Pressable>
      )}
    </View>
  );
}
