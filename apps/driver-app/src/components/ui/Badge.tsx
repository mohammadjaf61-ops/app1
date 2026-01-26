import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
  },
  success: {
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  danger: {
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  primary: {
    bg: 'bg-sky-100',
    text: 'text-sky-700',
  },
};

const sizeStyles = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
  },
  md: {
    padding: 'px-3 py-1',
    text: 'text-sm',
  },
  lg: {
    padding: 'px-4 py-1.5',
    text: 'text-base',
  },
};

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View className={`${variantStyle.bg} ${sizeStyle.padding} rounded-full`}>
      <Text className={`${variantStyle.text} ${sizeStyle.text} font-medium`}>
        {label}
      </Text>
    </View>
  );
}
