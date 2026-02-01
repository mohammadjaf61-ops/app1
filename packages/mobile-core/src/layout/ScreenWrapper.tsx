import { colors } from '@hypermarket/design-tokens';
import React from 'react';
import type { ViewStyle, StatusBarStyle } from 'react-native';
import { View, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type SafeAreaEdge = 'top' | 'bottom' | 'left' | 'right';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  bgColor?: string;
  edges?: SafeAreaEdge[];
  scrollable?: boolean;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
  statusBarStyle?: StatusBarStyle;
}

export function ScreenWrapper({
  children,
  bgColor = colors.background.primary,
  edges = ['top'],
  scrollable = false,
  contentStyle,
  style,
  statusBarStyle = 'dark-content',
}: ScreenWrapperProps) {
  return (
    <SafeAreaView className="flex-1" edges={edges} style={[{ backgroundColor: bgColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={bgColor} />
      {scrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: bgColor }}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1" style={[{ backgroundColor: bgColor }, contentStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
