import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui';
import { useVerifyOtp, useRequestOtp } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { formatPhone } from '@/lib/formatters';

type RouteProps = RouteProp<AuthStackParamList, 'Otp'>;

const OTP_LENGTH = 6;

export function OtpScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { phone } = route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();
  const { login } = useAuthStore();

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (digit && index === OTP_LENGTH - 1) {
      const code = newOtp.join('');
      if (code.length === OTP_LENGTH) {
        handleVerify(code);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert('خطأ', 'يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    try {
      const result = await verifyOtp.mutateAsync({ phone, code: otpCode });

      // Check if user is a PICKER
      if (result.user.role !== 'PICKER') {
        Alert.alert(
          'غير مصرح',
          'هذا التطبيق مخصص لموظفي التجهيز فقط',
          [{ text: 'حسناً', onPress: () => navigation.goBack() }]
        );
        return;
      }

      await login(result.accessToken, result.refreshToken, result.user);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'رمز التحقق غير صحيح');
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await requestOtp.mutateAsync(phone);
      setCountdown(60);
      Alert.alert('تم', 'تم إرسال رمز تحقق جديد');
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
        {/* Back Button */}
        <View className="px-4 pt-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-12 h-12 items-center justify-center bg-gray-100 rounded-xl"
          >
            <Ionicons name="arrow-forward" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
              <Ionicons name="shield-checkmark-outline" size={40} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              رمز التحقق
            </Text>
            <Text className="text-gray-500 text-center">
              تم إرسال رمز التحقق إلى
            </Text>
            <Text className="text-gray-900 font-bold text-lg mt-1" dir="ltr">
              {formatPhone(phone)}
            </Text>
          </View>

          {/* OTP Inputs */}
          <View className="flex-row-reverse justify-center mb-8">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                className={`
                  w-14 h-16 mx-1.5
                  bg-gray-100 rounded-xl
                  text-center text-2xl font-bold text-gray-900
                  ${digit ? 'border-2 border-primary' : ''}
                `}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <Button
            title="تحقق"
            onPress={() => handleVerify()}
            loading={verifyOtp.isPending}
            size="xl"
            fullWidth
          />

          {/* Resend */}
          <View className="mt-6 items-center">
            {countdown > 0 ? (
              <Text className="text-gray-500">
                إعادة الإرسال بعد {countdown} ثانية
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={requestOtp.isPending}>
                <Text className="text-primary font-bold text-lg">
                  إعادة إرسال الرمز
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Dev Note */}
          <View className="mt-8 bg-blue-50 p-4 rounded-xl">
            <Text className="text-blue-700 text-center text-sm">
              للتجربة: استخدم الرمز 123456
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
