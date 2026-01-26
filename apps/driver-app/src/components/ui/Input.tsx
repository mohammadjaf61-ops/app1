import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: 'md' | 'lg' | 'xl';
}

const sizeStyles = {
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
  style,
  ...props
}: InputProps) {
  const sizeStyle = sizeStyles[size];

  return (
    <View>
      {label && (
        <Text className="text-gray-700 font-medium text-right mb-2 text-base">
          {label}
        </Text>
      )}
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
      {error && (
        <Text className="text-red-500 text-sm text-right mt-1">{error}</Text>
      )}
    </View>
  );
}
