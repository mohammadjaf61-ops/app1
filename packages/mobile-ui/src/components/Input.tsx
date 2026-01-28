import React from 'react';
import type { TextInputProps, ViewStyle } from 'react-native';
import { View, Text, TextInput } from 'react-native';

export type InputSize = 'md' | 'lg' | 'xl';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: InputSize;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeStyles: Record<InputSize, { padding: string; text: string }> = {
  md: {
    padding: 'px-4 py-3',
    text: 'text-base',
  },
  lg: {
    padding: 'px-5 py-4',
    text: 'text-lg',
  },
  xl: {
    padding: 'px-6 py-5',
    text: 'text-xl',
  },
};

export function Input({
  label,
  error,
  size = 'lg',
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) {
  const sizeStyle = sizeStyles[size];
  const hasIcons = leftIcon || rightIcon;

  return (
    <View style={containerStyle}>
      {label && (
        <Text className="text-gray-700 font-medium text-right mb-2 text-base">{label}</Text>
      )}
      {hasIcons ? (
        <View
          className={`
            flex-row
            items-center
            bg-gray-100
            rounded-xl
            ${sizeStyle.padding}
            ${error ? 'border-2 border-red-500' : ''}
          `}
        >
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
          <TextInput
            className={`flex-1 ${sizeStyle.text} text-right text-gray-900`}
            placeholderTextColor="#9ca3af"
            style={style}
            {...props}
          />
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
        </View>
      ) : (
        <TextInput
          className={`
            bg-gray-100
            ${sizeStyle.padding}
            ${sizeStyle.text}
            rounded-xl
            text-right
            text-gray-900
            ${error ? 'border-2 border-red-500' : ''}
          `}
          placeholderTextColor="#9ca3af"
          style={style}
          {...props}
        />
      )}
      {error && <Text className="text-red-500 text-sm text-right mt-1">{error}</Text>}
    </View>
  );
}
