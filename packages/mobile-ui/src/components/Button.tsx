import React from 'react';
import type { TouchableOpacityProps } from 'react-native';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
  primary: {
    bg: 'bg-primary',
    text: 'text-white',
    border: '',
  },
  secondary: {
    bg: 'bg-gray-200',
    text: 'text-gray-900',
    border: '',
  },
  success: {
    bg: 'bg-success',
    text: 'text-white',
    border: '',
  },
  danger: {
    bg: 'bg-danger',
    text: 'text-white',
    border: '',
  },
  warning: {
    bg: 'bg-warning',
    text: 'text-white',
    border: '',
  },
  outline: {
    bg: 'bg-white',
    text: 'text-primary',
    border: 'border-2 border-primary',
  },
  ghost: {
    bg: 'bg-transparent',
    text: 'text-primary',
    border: '',
  },
};

const sizeStyles: Record<ButtonSize, { padding: string; text: string; minHeight: string }> = {
  sm: {
    padding: 'px-4 py-2',
    text: 'text-sm',
    minHeight: 'min-h-[36px]',
  },
  md: {
    padding: 'px-6 py-3',
    text: 'text-base',
    minHeight: 'min-h-[44px]',
  },
  lg: {
    padding: 'px-8 py-4',
    text: 'text-lg',
    minHeight: 'min-h-[52px]',
  },
  xl: {
    padding: 'px-10 py-5',
    text: 'text-xl',
    minHeight: 'min-h-[64px]',
  },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'right',
  style,
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  const getIndicatorColor = () => {
    if (variant === 'outline' || variant === 'secondary' || variant === 'ghost') {
      return '#16a34a';
    }
    return 'white';
  };

  return (
    <TouchableOpacity
      className={`
        ${variantStyle.bg}
        ${variantStyle.border}
        ${sizeStyle.padding}
        ${sizeStyle.minHeight}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl
        flex-row
        items-center
        justify-center
        ${isDisabled ? 'opacity-50' : ''}
      `}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getIndicatorColor()} size="small" />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && iconPosition === 'left' && <View className="ml-2">{icon}</View>}
          <Text
            className={`
              ${variantStyle.text}
              ${sizeStyle.text}
              font-bold
              text-center
            `}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View className="mr-2">{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}
