/**
 * Address Store
 * Manages default delivery address with AsyncStorage persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface DeliveryAddress {
  id: string;
  label: string; // e.g., "المنزل", "العمل"
  fullAddress: string;
  area: string;
  notes?: string;
  isDefault: boolean;
}

interface AddressState {
  addresses: DeliveryAddress[];
  defaultAddressId: string | null;

  // Actions
  addAddress: (address: Omit<DeliveryAddress, 'id'>) => string;
  updateAddress: (id: string, address: Partial<DeliveryAddress>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getDefaultAddress: () => DeliveryAddress | null;
}

const STORAGE_KEY = 'address-store';

// Generate unique ID
function generateId(): string {
  return `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      defaultAddressId: null,

      addAddress: (addressData) => {
        const id = generateId();
        const address: DeliveryAddress = {
          ...addressData,
          id,
        };

        set((state) => {
          const newAddresses = [...state.addresses, address];

          // If this is the first address or marked as default, set it as default
          const newDefaultId =
            addressData.isDefault || newAddresses.length === 1
              ? id
              : state.defaultAddressId;

          // Update isDefault flags
          const updatedAddresses = newAddresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === newDefaultId,
          }));

          return {
            addresses: updatedAddresses,
            defaultAddressId: newDefaultId,
          };
        });

        return id;
      },

      updateAddress: (id, updates) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === id ? { ...addr, ...updates } : addr,
          ),
        }));
      },

      removeAddress: (id) => {
        set((state) => {
          const newAddresses = state.addresses.filter((addr) => addr.id !== id);
          let newDefaultId = state.defaultAddressId;

          // If we removed the default, set first available as default
          if (state.defaultAddressId === id) {
            newDefaultId = newAddresses.length > 0 ? newAddresses[0].id : null;
          }

          return {
            addresses: newAddresses.map((addr) => ({
              ...addr,
              isDefault: addr.id === newDefaultId,
            })),
            defaultAddressId: newDefaultId,
          };
        });
      },

      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id,
          })),
          defaultAddressId: id,
        }));
      },

      getDefaultAddress: () => {
        const state = get();
        if (!state.defaultAddressId) {
          // Return first address if exists
          return state.addresses.length > 0 ? state.addresses[0] : null;
        }
        return state.addresses.find((addr) => addr.id === state.defaultAddressId) || null;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * Quick helper to get default address text
 */
export function getDefaultAddressText(): string {
  const state = useAddressStore.getState();
  const defaultAddr = state.getDefaultAddress();
  return defaultAddr?.fullAddress || '';
}
