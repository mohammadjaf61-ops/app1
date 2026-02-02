import { User, MapPin, Settings, LogOut, ChevronLeft } from 'lucide-react-native';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '@hypermarket/design-tokens';

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-primary-900">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">حسابي</Text>
      </View>

      {/* User Info */}
      <View className="px-4 py-6">
        <View className="flex-row items-center">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center">
            <User size={32} color={colors.primary[500]} />
          </View>
          <View className="mr-4 flex-1">
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              اسم المستخدم
            </Text>
            <Text className="text-gray-500 dark:text-gray-300">07XXXXXXXXX</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View className="px-4">
        <MenuItem icon={<MapPin size={20} color={colors.text.secondary} />} label="عناوين التوصيل" />
        <MenuItem icon={<Settings size={20} color={colors.text.secondary} />} label="الإعدادات" />
        <MenuItem icon={<LogOut size={20} color={colors.status.error.main} />} label="تسجيل الخروج" danger />
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
      {icon}
      <Text className={`flex-1 mr-3 ${danger ? 'text-red-500' : 'text-gray-900'}`}>{label}</Text>
      <ChevronLeft size={20} color={colors.text.disabled} />
    </TouchableOpacity>
  );
}
