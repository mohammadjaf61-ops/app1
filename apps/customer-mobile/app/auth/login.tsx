import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // TODO: Implement actual login
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/tabs/home');
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-center text-gray-900">الهايبرماركت</Text>
            <Text className="text-gray-500 text-center mt-2">مرحباً بك، سجل دخولك للمتابعة</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 mb-2">رقم الهاتف</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-left"
                placeholder="07XXXXXXXXX"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!isLoading}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-2">كلمة المرور</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="أدخل كلمة المرور"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              className="bg-primary rounded-lg py-4 mt-4"
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text className="text-white text-center font-semibold">
                {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/register')} disabled={isLoading}>
              <Text className="text-primary text-center mt-4">ليس لديك حساب؟ سجل الآن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
