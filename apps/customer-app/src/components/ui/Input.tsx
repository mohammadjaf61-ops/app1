import React from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  ViewStyle,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  return (
    <View style={containerStyle}>
      {label && (
        <Text className="text-gray-700 font-medium mb-2 text-right">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-gray-100 rounded-xl px-4 ${
          error ? 'border border-red-500' : ''
        }`}
      >
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
        <TextInput
          className="flex-1 py-3 text-right text-base text-gray-900"
          placeholderTextColor="#9ca3af"
          textAlign="right"
          {...props}
        />
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-1 text-right">{error}</Text>
      )}
    </View>
  );
}
