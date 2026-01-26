import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: { bg: 'bg-gray-100', text: 'text-gray-800' },
  success: { bg: 'bg-green-100', text: 'text-green-800' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  error: { bg: 'bg-red-100', text: 'text-red-800' },
  info: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  const styles = variantStyles[variant];
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View className={`${styles.bg} ${sizeStyles} rounded-full`}>
      <Text className={`${styles.text} ${textSize} font-medium`}>{label}</Text>
    </View>
  );
}
