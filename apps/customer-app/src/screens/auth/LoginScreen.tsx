import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = useAuthStore((state) => state.sendOtp);

  const handleSubmit = async () => {
    if (!phone || phone.length < 10) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendOtp(phone);
      navigation.navigate('Otp', { phone });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bgColor="#fff">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="bg-primary/10 w-20 h-20 rounded-full items-center justify-center mb-4">
              <Ionicons name="storefront" size={40} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">هايبرماركت</Text>
            <Text className="text-gray-500 mt-2">تسوق بسهولة من منزلك</Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <Text className="text-xl font-bold text-gray-900 text-right mb-6">
              تسجيل الدخول
            </Text>

            <Input
              label="رقم الهاتف"
              placeholder="07XX XXX XXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={11}
              error={error}
              rightIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
            />

            <Button
              title="متابعة"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />

            <Text className="text-center text-gray-500 text-sm mt-4">
              بالمتابعة، أنت توافق على{' '}
              <Text className="text-primary">الشروط والأحكام</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
