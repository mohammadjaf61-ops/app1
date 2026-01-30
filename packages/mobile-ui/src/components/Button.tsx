import React, { useRef, useCallback } from 'react';
import type { PressableProps, ViewStyle, StyleProp } from 'react-native';
import { Pressable, Text, ActivityIndicator, View, Animated, AccessibilityInfo } from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
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

const SCALE_PRESSED = 0.98;
const SCALE_NORMAL = 1;
const DURATION_FAST = 100;

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
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const reduceMotionRef = useRef(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionRef.current = enabled;
    });
  }, []);

  const handlePressIn = useCallback(
    (e: any) => {
      if (!reduceMotionRef.current) {
        Animated.timing(scaleAnim, {
          toValue: SCALE_PRESSED,
          duration: DURATION_FAST,
          useNativeDriver: true,
        }).start();
      }
      onPressIn?.(e);
    },
    [scaleAnim, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      if (!reduceMotionRef.current) {
        Animated.timing(scaleAnim, {
          toValue: SCALE_NORMAL,
          duration: DURATION_FAST,
          useNativeDriver: true,
        }).start();
      }
      onPressOut?.(e);
    },
    [scaleAnim, onPressOut]
  );

  const getIndicatorColor = () => {
    if (variant === 'outline' || variant === 'secondary' || variant === 'ghost') {
      return '#16a34a';
    }
    return 'white';
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
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
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
      </Pressable>
    </Animated.View>
  );
}
