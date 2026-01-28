import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { formatPhone } from '@/lib/formatters';
import { useAuthStore } from '@/stores/auth-store';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center bg-white p-4 mb-1"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showArrow && <Ionicons name="chevron-back" size={20} color="#9ca3af" />}
      <View className="flex-1 mr-3">
        <Text className={`font-medium text-right ${danger ? 'text-red-500' : 'text-gray-900'}`}>
          {title}
        </Text>
        {subtitle && <Text className="text-gray-500 text-sm text-right">{subtitle}</Text>}
      </View>
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${
          danger ? 'bg-red-100' : 'bg-primary/10'
        }`}
      >
        <Ionicons name={icon} size={20} color={danger ? '#ef4444' : '#16a34a'} />
      </View>
    </TouchableOpacity>
  );
}

export function AccountScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: logout,
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-4 pt-12 pb-8">
          <View className="items-center">
            <View className="bg-white w-20 h-20 rounded-full items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-primary">{user?.fullName?.[0] || 'م'}</Text>
            </View>
            <Text className="text-white font-bold text-xl">{user?.fullName || 'المستخدم'}</Text>
            <Text className="text-white/80 mt-1" dir="ltr">
              {user?.phone ? formatPhone(user.phone) : ''}
            </Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View className="py-4">
          {/* Account Section */}
          <Text className="text-gray-500 text-sm px-4 mb-2 text-right">الحساب</Text>
          <MenuItem
            icon="person-outline"
            title="الملف الشخصي"
            subtitle="تعديل الاسم والمعلومات"
            onPress={() => {}}
          />
          <MenuItem
            icon="location-outline"
            title="العناوين"
            subtitle="إدارة عناوين التوصيل"
            onPress={() => {}}
          />

          {/* Orders Section */}
          <Text className="text-gray-500 text-sm px-4 mb-2 mt-4 text-right">الطلبات</Text>
          <MenuItem
            icon="receipt-outline"
            title="طلباتي"
            subtitle="عرض سجل الطلبات"
            onPress={() => {}}
          />
          <MenuItem
            icon="heart-outline"
            title="المفضلة"
            subtitle="المنتجات المحفوظة"
            onPress={() => {}}
          />

          {/* Support Section */}
          <Text className="text-gray-500 text-sm px-4 mb-2 mt-4 text-right">الدعم</Text>
          <MenuItem icon="help-circle-outline" title="المساعدة والدعم" onPress={() => {}} />
          <MenuItem icon="chatbubble-outline" title="تواصل معنا" onPress={() => {}} />
          <MenuItem icon="document-text-outline" title="الشروط والأحكام" onPress={() => {}} />
          <MenuItem icon="shield-outline" title="سياسة الخصوصية" onPress={() => {}} />

          {/* Logout */}
          <View className="mt-4">
            <MenuItem
              icon="log-out-outline"
              title="تسجيل الخروج"
              onPress={handleLogout}
              showArrow={false}
              danger
            />
          </View>

          {/* App Version */}
          <Text className="text-gray-400 text-center text-sm mt-6 mb-4">الإصدار 1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
