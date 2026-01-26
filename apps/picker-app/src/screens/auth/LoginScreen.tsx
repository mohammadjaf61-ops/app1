import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button, Input } from '@/components/ui';
import { useRequestOtp } from '@/hooks/use-api';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [phone, setPhone] = useState('');
  const requestOtp = useRequestOtp();

  const handleRequestOtp = async () => {
    // Validate phone
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      Alert.alert('خطأ', 'يرجى إدخال رقم هاتف صحيح');
      return;
    }

    try {
      await requestOtp.mutateAsync(cleanPhone);
      navigation.navigate('Otp', { phone: cleanPhone });
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في إرسال رمز التحقق');
    }
  };

  return (
    <ScreenWrapper bgColor="#fff">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo / Header */}
          <View className="items-center mb-12">
            <View className="w-24 h-24 bg-primary/10 rounded-3xl items-center justify-center mb-6">
              <Ionicons name="cart-outline" size={48} color="#16a34a" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              تطبيق التجهيز
            </Text>
            <Text className="text-gray-500 text-lg text-center">
              مخصص لموظفي تجهيز الطلبات
            </Text>
          </View>

          {/* Login Form */}
          <View className="mb-8">
            <Input
              label="رقم الهاتف"
              value={phone}
              onChangeText={setPhone}
              placeholder="07XX XXX XXXX"
              keyboardType="phone-pad"
              maxLength={14}
              size="xl"
            />
            <Text className="text-gray-400 text-sm text-right mt-2">
              سيتم إرسال رمز التحقق إلى هذا الرقم
            </Text>
          </View>

          <Button
            title="إرسال رمز التحقق"
            onPress={handleRequestOtp}
            loading={requestOtp.isPending}
            size="xl"
            fullWidth
            icon={<Ionicons name="arrow-back" size={20} color="white" />}
          />

          {/* Info */}
          <View className="mt-8 bg-amber-50 p-4 rounded-xl">
            <View className="flex-row items-center justify-end mb-2">
              <Text className="text-amber-800 font-bold mr-2">ملاحظة</Text>
              <Ionicons name="information-circle" size={20} color="#d97706" />
            </View>
            <Text className="text-amber-700 text-right">
              هذا التطبيق مخصص لموظفي التجهيز فقط. إذا كنت عميلاً، يرجى استخدام
              تطبيق العملاء.
            </Text>
          </View>
        </View>

        {/* Version */}
        <View className="pb-6 items-center">
          <Text className="text-gray-400 text-sm">الإصدار 1.0.0</Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
