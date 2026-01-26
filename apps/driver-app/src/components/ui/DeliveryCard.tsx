import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';
import {
  formatCurrencyShort,
  formatTimeElapsed,
  orderStatusLabels,
  orderStatusColors,
  paymentMethodLabels,
} from '@/lib/formatters';

interface DeliveryCardProps {
  delivery: {
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    deliveryAddressText: string;
    total: number;
    paymentMethod?: string;
    createdAt: string;
    itemsCount?: number;
  };
  onPress: () => void;
}

export function DeliveryCard({ delivery, onPress }: DeliveryCardProps) {
  const statusColor = orderStatusColors[delivery.status] || { bg: '#f3f4f6', text: '#374151' };
  const isOutForDelivery = delivery.status === 'OUT_FOR_DELIVERY';

  return (
    <TouchableOpacity
      className={`
        bg-white rounded-2xl p-4 mb-3
        border-r-4
        ${isOutForDelivery ? 'border-primary' : 'border-secondary'}
      `}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Badge
            label={paymentMethodLabels[delivery.paymentMethod || 'COD']}
            variant={delivery.paymentMethod === 'COD' ? 'warning' : 'success'}
            size="sm"
          />
        </View>
        <View className="flex-row items-center">
          <Text className="text-gray-900 font-bold text-lg">
            #{delivery.orderNumber}
          </Text>
          <View
            className="px-2 py-1 rounded-full mr-2"
            style={{ backgroundColor: statusColor.bg }}
          >
            <Text style={{ color: statusColor.text }} className="text-xs font-medium">
              {orderStatusLabels[delivery.status]}
            </Text>
          </View>
        </View>
      </View>

      {/* Customer Info */}
      <View className="flex-row items-center justify-end mb-2">
        <Text className="text-gray-700 font-medium mr-2">{delivery.customerName}</Text>
        <Ionicons name="person-outline" size={16} color="#6b7280" />
      </View>

      {/* Address */}
      <View className="flex-row items-start justify-end mb-3">
        <Text className="text-gray-500 text-sm text-right flex-1 mr-2" numberOfLines={2}>
          {delivery.deliveryAddressText}
        </Text>
        <Ionicons name="location-outline" size={16} color="#9ca3af" />
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#9ca3af" />
          <Text className="text-gray-400 text-sm mr-1">
            {formatTimeElapsed(delivery.createdAt)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-primary font-bold text-lg">
            {formatCurrencyShort(delivery.total)}
          </Text>
          <Ionicons name="chevron-back" size={18} color="#9ca3af" className="mr-2" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
