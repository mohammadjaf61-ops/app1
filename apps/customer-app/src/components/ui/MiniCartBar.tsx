import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';

import { useT } from '@/hooks/use-t';
import { formatCurrencyShort } from '@/lib/formatters';
import { durations, easings, translates, shouldReduceMotion } from '@/lib/motion';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useCartStore } from '@/stores/cart-store';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MiniCartBarProps {
  toCheckout?: boolean;
}

export function MiniCartBar({ toCheckout = false }: MiniCartBarProps) {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useT();
  const items = useCartStore((state) => state.items);
  const prevCountRef = useRef(0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const bumpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prevCountRef.current !== itemCount && itemCount > 0 && !shouldReduceMotion()) {
      Animated.sequence([
        Animated.timing(bumpAnim, {
          toValue: translates.bump,
          duration: durations.fast,
          easing: easings.decelerate,
          useNativeDriver: true,
        }),
        Animated.timing(bumpAnim, {
          toValue: 0,
          duration: durations.fast,
          easing: easings.standard,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevCountRef.current = itemCount;
  }, [itemCount, bumpAnim]);

  if (itemCount === 0) {
    return null;
  }

  const handlePress = () => {
    if (toCheckout) {
      navigation.navigate('Checkout');
    } else {
      navigation.navigate('Main', { screen: 'Cart' } as never);
    }
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 px-4 pb-4">
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}
      >
        <Animated.View
          className="bg-primary flex-row items-center justify-between px-4 py-3 rounded-2xl shadow-lg"
          style={{
            shadowColor: '#16a34a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            transform: [{ translateY: bumpAnim }],
          }}
        >
          <View className="flex-row items-center">
            <View className="bg-white/20 rounded-full px-3 py-1">
              <Text className="text-white font-bold">{itemCount}</Text>
            </View>
            <Ionicons name="cart" size={24} color="white" style={{ marginLeft: 8 }} />
          </View>

          <Text className="text-white font-bold text-base">
            {toCheckout ? t('checkout.title') : t('cart.viewCart')}
          </Text>

          <View className="flex-row items-center">
            <Text className="text-white font-bold text-lg">{formatCurrencyShort(total)}</Text>
            <Ionicons name="chevron-back" size={20} color="white" style={{ marginRight: 4 }} />
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}
