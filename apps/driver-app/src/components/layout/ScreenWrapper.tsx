import React from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: React.ReactNode;
  bgColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenWrapper({
  children,
  bgColor = '#f9fafb',
  edges = ['top'],
}: ScreenWrapperProps) {
  return (
    <SafeAreaView
      className="flex-1"
      edges={edges}
      style={{ backgroundColor: bgColor }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={bgColor} />
      <View className="flex-1" style={{ backgroundColor: bgColor }}>
        {children}
      </View>
    </SafeAreaView>
  );
}
