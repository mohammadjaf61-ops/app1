/**
 * Store Status Badge Component
 * Displays current store open/closed status
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text } from 'react-native';

import { getStoreStatusBadge, isStoreOpen } from '@/lib/store-status';

interface StoreStatusBadgeProps {
  /** Show detailed message */
  showMessage?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

export function StoreStatusBadge({ showMessage = false, size = 'md' }: StoreStatusBadgeProps) {
  const badge = getStoreStatusBadge();
  const status = isStoreOpen();

  const colorClasses = {
    green: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: '#15803d',
    },
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      icon: '#b45309',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: '#b91c1c',
    },
  };

  const colors = colorClasses[badge.color];
  const iconSize = size === 'sm' ? 12 : 16;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <View className="flex-row items-center">
      <View className={`flex-row items-center ${colors.bg} ${padding} rounded-full`}>
        <Ionicons
          name={badge.isOpen ? 'checkmark-circle' : 'time-outline'}
          size={iconSize}
          color={colors.icon}
        />
        <Text className={`${colors.text} ${textSize} font-medium mr-1`}>{badge.text}</Text>
      </View>

      {showMessage && !badge.isOpen && (
        <Text className="text-gray-500 text-xs mr-2">{status.message}</Text>
      )}
    </View>
  );
}
