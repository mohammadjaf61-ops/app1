import { router, useLocalSearchParams } from 'expo-router';
import { FileText, Shield, RefreshCw, CheckCircle } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';

import { useToast } from '../components/Toast';
import { useCartStore } from '../stores/cart-store';

// Document version - should match backend
const DOCUMENT_VERSION = '1.0';

// API base URL - in production, use environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ConsentDocument {
  type: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'RETURN_REFUND';
  titleAr: string;
  descriptionAr: string;
  icon: React.ReactNode;
  accepted: boolean;
}

export default function ConsentScreen() {
  const { showToast } = useToast();
  const { customerPhone } = useCartStore();
  const params = useLocalSearchParams<{ returnTo?: string }>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<ConsentDocument[]>([
    {
      type: 'TERMS_OF_SERVICE',
      titleAr: 'شروط الخدمة',
      descriptionAr: 'الشروط والأحكام العامة لاستخدام التطبيق والخدمة',
      icon: <FileText size={24} color="#3b82f6" />,
      accepted: false,
    },
    {
      type: 'PRIVACY_POLICY',
      titleAr: 'سياسة الخصوصية',
      descriptionAr: 'كيفية جمع واستخدام وحماية بياناتك الشخصية',
      icon: <Shield size={24} color="#22c55e" />,
      accepted: false,
    },
    {
      type: 'RETURN_REFUND',
      titleAr: 'سياسة الإرجاع والاسترداد',
      descriptionAr: 'شروط إرجاع المنتجات واسترداد المبالغ',
      icon: <RefreshCw size={24} color="#f59e0b" />,
      accepted: false,
    },
  ]);

  const allAccepted = documents.every((doc) => doc.accepted);
  const requiredAccepted = documents
    .filter((doc) => doc.type !== 'RETURN_REFUND')
    .every((doc) => doc.accepted);

  const toggleDocument = (type: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.type === type ? { ...doc, accepted: !doc.accepted } : doc)),
    );
  };

  const openDocument = (type: string) => {
    // In production, open the actual document URL
    const docUrls: Record<string, string> = {
      TERMS_OF_SERVICE: 'https://example.com/terms',
      PRIVACY_POLICY: 'https://example.com/privacy',
      RETURN_REFUND: 'https://example.com/refund',
    };

    Linking.openURL(docUrls[type] || 'https://example.com');
  };

  const handleAcceptAll = () => {
    setDocuments((prev) => prev.map((doc) => ({ ...doc, accepted: true })));
  };

  const handleSubmit = async () => {
    if (!requiredAccepted) {
      showToast('يجب الموافقة على شروط الخدمة وسياسة الخصوصية', 'warning');
      return;
    }

    if (!customerPhone) {
      showToast('يرجى إدخال رقم الهاتف أولاً', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const acceptedTypes = documents.filter((doc) => doc.accepted).map((doc) => doc.type);

      const response = await fetch(`${API_BASE_URL}/consent/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: customerPhone,
          documentTypes: acceptedTypes,
          version: DOCUMENT_VERSION,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل في تسجيل الموافقة');
      }

      showToast('تم تسجيل موافقتك بنجاح', 'success');

      // Navigate to the return destination or checkout
      if (params.returnTo) {
        router.replace(params.returnTo as any);
      } else {
        router.replace('/checkout');
      }
    } catch (error) {
      console.error('Consent error:', error);
      showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              الموافقة على الشروط
            </Text>
            <Text className="text-gray-500 text-center leading-6">
              للمتابعة، يرجى قراءة والموافقة على الوثائق القانونية التالية
            </Text>
          </View>

          {/* Documents List */}
          <View className="mb-6">
            {documents.map((doc) => (
              <View
                key={doc.type}
                className={`mb-4 p-4 rounded-xl border-2 ${
                  doc.accepted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-center mb-2">
                  <Pressable
                    onPress={() => toggleDocument(doc.type)}
                    className={`w-6 h-6 rounded border-2 items-center justify-center ml-3 ${
                      doc.accepted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {doc.accepted && <CheckCircle size={16} color="white" />}
                  </Pressable>
                  <View className="flex-1 flex-row items-center justify-end">
                    <View className="flex-1 mr-3">
                      <Text className="text-gray-900 font-semibold text-right text-lg">
                        {doc.titleAr}
                      </Text>
                      <Text className="text-gray-500 text-sm text-right mt-1">
                        {doc.descriptionAr}
                      </Text>
                    </View>
                    <View className="bg-gray-100 w-12 h-12 rounded-full items-center justify-center">
                      {doc.icon}
                    </View>
                  </View>
                </View>

                <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
                  <Pressable onPress={() => toggleDocument(doc.type)}>
                    <Text
                      className={`font-medium ${
                        doc.accepted ? 'text-green-600' : 'text-primary'
                      }`}
                    >
                      {doc.accepted ? 'تمت الموافقة ✓' : 'الموافقة'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => openDocument(doc.type)}>
                    <Text className="text-blue-600 underline">قراءة النص الكامل</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* Accept All Button */}
          {!allAccepted && (
            <Pressable
              onPress={handleAcceptAll}
              className="py-3 rounded-xl border-2 border-primary mb-6"
            >
              <Text className="text-primary font-bold text-center text-lg">
                الموافقة على الجميع
              </Text>
            </Pressable>
          )}

          {/* Required Documents Notice */}
          <View className="bg-blue-50 p-4 rounded-xl mb-6">
            <Text className="text-blue-800 text-sm text-right leading-5">
              <Text className="font-bold">ملاحظة: </Text>
              الموافقة على شروط الخدمة وسياسة الخصوصية مطلوبة للمتابعة. سياسة الإرجاع اختيارية
              ولكننا ننصح بقراءتها.
            </Text>
          </View>

          {/* Legal Text */}
          <Text className="text-gray-400 text-xs text-center leading-5 mb-4">
            بالنقر على "المتابعة"، أنت توافق على الشروط المحددة أعلاه. يتم تخزين موافقتك بشكل آمن
            ويمكنك مراجعة هذه الوثائق في أي وقت من إعدادات التطبيق.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="p-4 bg-white border-t border-gray-100 shadow-lg">
        <Pressable
          onPress={handleSubmit}
          disabled={!requiredAccepted || isSubmitting}
          className={`py-4 rounded-xl flex-row items-center justify-center ${
            !requiredAccepted || isSubmitting ? 'bg-gray-300' : 'bg-primary'
          }`}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-bold text-lg mr-2">جاري التسجيل...</Text>
            </>
          ) : (
            <Text className="text-white font-bold text-lg">
              {requiredAccepted ? 'المتابعة' : 'يرجى الموافقة على الشروط المطلوبة'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
