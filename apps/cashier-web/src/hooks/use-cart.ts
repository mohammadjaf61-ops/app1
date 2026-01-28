'use client';

import { useCallback, useState } from 'react';

export interface CartItem {
  sku: string;
  nameAr: string;
  quantity: number;
  unitPriceIqd: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.sku === item.sku);
      if (existing) {
        return prev.map((i) =>
          i.sku === item.sku
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i,
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }, []);

  const removeItem = useCallback((sku: string) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku));
  }, []);

  const updateQuantity = useCallback((sku: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.sku !== sku));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.sku === sku ? { ...i, quantity } : i)),
      );
    }
  }, []);

  const incrementQuantity = useCallback((sku: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.sku === sku ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    );
  }, []);

  const decrementQuantity = useCallback((sku: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.sku === sku);
      if (item && item.quantity <= 1) {
        return prev.filter((i) => i.sku !== sku);
      }
      return prev.map((i) =>
        i.sku === sku ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPriceIqd * item.quantity,
    0,
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    subtotal,
    itemCount,
    isEmpty: items.length === 0,
  };
}
