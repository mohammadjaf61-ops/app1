import React from 'react';
import { View, SafeAreaView, StatusBar, ScrollView, ViewStyle } from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  safeArea?: boolean;
  bgColor?: string;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  style,
  contentStyle,
  safeArea = true,
  bgColor = '#f9fafb',
}: ScreenWrapperProps) {
  const Container = safeArea ? SafeAreaView : View;

  return (
    <Container className="flex-1" style={[{ backgroundColor: bgColor }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={bgColor} />
      {scrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1" style={contentStyle}>
          {children}
        </View>
      )}
    </Container>
  );
}
