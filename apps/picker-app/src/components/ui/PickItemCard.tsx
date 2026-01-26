import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';
import { Button } from './Button';
import { formatLocation } from '@/lib/formatters';
import { UNAVAILABLE_REASONS, UnavailableReason } from '@/lib/constants';

interface PickItemCardProps {
  item: {
    id: string;
    product: {
      nameAr: string;
      sku: string;
      imageUrl?: string;
      aisle?: string;
      shelf?: string;
    };
    quantity: number;
  };
  status: 'pending' | 'picked' | 'unavailable';
  unavailableReason?: string;
  onPick: () => void;
  onMarkUnavailable: (reason: UnavailableReason, notes?: string) => void;
  onUndo?: () => void;
  disabled?: boolean;
}

export function PickItemCard({
  item,
  status,
  unavailableReason,
  onPick,
  onMarkUnavailable,
  onUndo,
  disabled = false,
}: PickItemCardProps) {
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<UnavailableReason | null>(null);

  const handlePick = () => {
    // Confirm before marking as picked
    Alert.alert(
      'تأكيد التجهيز',
      `هل تم تجهيز "${item.product.nameAr}" (${item.quantity} قطعة)؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'نعم، تم التجهيز', onPress: onPick },
      ]
    );
  };

  const handleUnavailable = () => {
    if (!selectedReason) return;
    onMarkUnavailable(selectedReason);
    setShowUnavailableModal(false);
    setSelectedReason(null);
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'picked':
        return 'bg-green-50 border-green-500';
      case 'unavailable':
        return 'bg-red-50 border-red-500';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const reasonLabel = unavailableReason
    ? UNAVAILABLE_REASONS.find((r) => r.value === unavailableReason)?.label
    : null;

  return (
    <>
      <View
        className={`
          ${getStatusStyle()}
          border-2
          rounded-2xl
          p-4
          mb-3
        `}
      >
        {/* Location Badge */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text className="text-gray-500 text-sm mr-1">
              {formatLocation(item.product.aisle, item.product.shelf)}
            </Text>
          </View>
          <Badge
            label={`${item.quantity} قطعة`}
            variant={status === 'picked' ? 'success' : 'default'}
            size="md"
          />
        </View>

        {/* Product Info */}
        <View className="flex-row mb-4">
          {/* Image */}
          <View className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden">
            {item.product.imageUrl ? (
              <Image
                source={{ uri: item.product.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Ionicons name="cube-outline" size={32} color="#9ca3af" />
              </View>
            )}
          </View>

          {/* Details */}
          <View className="flex-1 mr-4">
            <Text className="text-gray-900 font-bold text-lg text-right mb-1">
              {item.product.nameAr}
            </Text>
            <Text className="text-gray-400 text-sm text-right">
              SKU: {item.product.sku}
            </Text>
          </View>
        </View>

        {/* Status Indicator */}
        {status === 'picked' && (
          <View className="flex-row items-center justify-center bg-green-100 py-3 rounded-xl mb-3">
            <Text className="text-green-700 font-bold text-lg ml-2">تم التجهيز</Text>
            <Ionicons name="checkmark-circle" size={24} color="#15803d" />
          </View>
        )}

        {status === 'unavailable' && (
          <View className="flex-row items-center justify-center bg-red-100 py-3 rounded-xl mb-3">
            <Text className="text-red-700 font-bold text-lg ml-2">
              غير متوفر - {reasonLabel}
            </Text>
            <Ionicons name="close-circle" size={24} color="#dc2626" />
          </View>
        )}

        {/* Action Buttons */}
        {status === 'pending' && (
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-4 rounded-xl items-center justify-center ml-2"
              onPress={() => setShowUnavailableModal(true)}
              disabled={disabled}
            >
              <Ionicons name="close-circle-outline" size={24} color="#ef4444" />
              <Text className="text-gray-700 font-medium mt-1">غير متوفر</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-primary py-4 rounded-xl items-center justify-center mr-2"
              onPress={handlePick}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle-outline" size={28} color="white" />
              <Text className="text-white font-bold text-lg mt-1">تم التجهيز</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Undo Button */}
        {status !== 'pending' && onUndo && (
          <TouchableOpacity
            className="flex-row items-center justify-center py-2"
            onPress={onUndo}
          >
            <Ionicons name="arrow-undo-outline" size={18} color="#6b7280" />
            <Text className="text-gray-500 mr-2">تراجع</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unavailable Reason Modal */}
      <Modal
        visible={showUnavailableModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUnavailableModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 text-right mb-6">
              سبب عدم التوفر
            </Text>

            {UNAVAILABLE_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                className={`
                  flex-row
                  items-center
                  justify-between
                  p-4
                  mb-3
                  rounded-xl
                  border-2
                  ${selectedReason === reason.value ? 'border-primary bg-primary/5' : 'border-gray-200'}
                `}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View
                  className={`
                    w-6 h-6 rounded-full border-2
                    ${selectedReason === reason.value ? 'border-primary bg-primary' : 'border-gray-300'}
                    items-center justify-center
                  `}
                >
                  {selectedReason === reason.value && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text className="text-gray-900 font-medium text-lg">
                  {reason.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View className="flex-row mt-4">
              <Button
                title="إلغاء"
                variant="secondary"
                size="lg"
                onPress={() => {
                  setShowUnavailableModal(false);
                  setSelectedReason(null);
                }}
                style={{ flex: 1, marginLeft: 8 }}
              />
              <Button
                title="تأكيد"
                variant="danger"
                size="lg"
                onPress={handleUnavailable}
                disabled={!selectedReason}
                style={{ flex: 1, marginRight: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
