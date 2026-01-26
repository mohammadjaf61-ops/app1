import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { formatPhone } from '@/lib/formatters';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Otp'>;
  route: RouteProp<AuthStackParamList, 'Otp'>;
};

const OTP_LENGTH = 6;

export function OtpScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const { verifyOtp, sendOtp } = useAuthStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      await verifyOtp(phone, code);
      // Navigation will be handled by RootNavigator based on auth state
    } catch (err: any) {
      setError(err.message || 'رمز التحقق غير صحيح');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendOtp(phone);
      setCountdown(60);
      setError('');
    } catch (err: any) {
      setError(err.message || 'فشل في إعادة الإرسال');
    }
  };

  return (
    <ScreenWrapper bgColor="#fff">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-12">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-row items-center mb-8"
          >
            <Ionicons name="arrow-forward" size={24} color="#16a34a" />
            <Text className="text-primary font-medium mr-2">رجوع</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 text-right">
              رمز التحقق
            </Text>
            <Text className="text-gray-500 mt-2 text-right">
              تم إرسال رمز التحقق إلى
            </Text>
            <Text className="text-gray-900 font-medium mt-1 text-right" dir="ltr">
              {formatPhone(phone)}
            </Text>
          </View>

          {/* OTP Input */}
          <View className="flex-row-reverse justify-between mb-6">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold ${
                  error ? 'border-red-500' : digit ? 'border-primary' : 'border-gray-200'
                }`}
                value={digit}
                onChangeText={(value) => handleChange(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error && (
            <Text className="text-red-500 text-center mb-4">{error}</Text>
          )}

          {/* Dev hint for mock OTP */}
          <View className="bg-yellow-50 p-3 rounded-lg mb-6">
            <Text className="text-yellow-800 text-center text-sm">
              للتجربة: استخدم الرمز 123456
            </Text>
          </View>

          <Button
            title="تأكيد"
            onPress={() => handleVerify(otp.join(''))}
            loading={loading}
            disabled={otp.some((digit) => !digit)}
            fullWidth
            size="lg"
          />

          {/* Resend */}
          <View className="mt-6 items-center">
            {countdown > 0 ? (
              <Text className="text-gray-500">
                إعادة الإرسال بعد {countdown} ثانية
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text className="text-primary font-medium">
                  إعادة إرسال الرمز
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
