import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { DELIVERY_FEE } from '@/lib/constants';

export interface CartItem {
  productId: string;
  sku: string;
  nameAr: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  deliveryAddress: string;
  notes: string;

  // Computed
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryAddress: (address: string) => void;
  setNotes: (notes: string) => void;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryAddress: '',
      notes: '',

      // Computed values (recalculated on access)
      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      get subtotal() {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      get deliveryFee() {
        return get().items.length > 0 ? DELIVERY_FEE : 0;
      },
      get total() {
        return get().subtotal + get().deliveryFee;
      },

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.productId === item.productId);

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          }

          return {
            items: [...state.items, { ...item, quantity }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item,
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], deliveryAddress: '', notes: '' });
      },

      setDeliveryAddress: (address) => {
        set({ deliveryAddress: address });
      },

      setNotes: (notes) => {
        set({ notes });
      },

      getItemQuantity: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        return item?.quantity || 0;
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        deliveryAddress: state.deliveryAddress,
        notes: state.notes,
      }),
    },
  ),
);
