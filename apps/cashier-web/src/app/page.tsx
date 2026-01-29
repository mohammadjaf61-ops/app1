'use client';

import {
  Barcode,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { CartItem } from '@/hooks/use-cart';
import { useCart } from '@/hooks/use-cart';
import type { PosOrderResponse } from '@/lib/api';
import { posApi } from '@/lib/api';

type ViewState = 'cart' | 'receipt' | 'login';

export default function PosPage() {
  const [view, setView] = useState<ViewState>('login');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<PosOrderResponse | null>(null);
  const [cashierName, setCashierName] = useState('');

  // Login state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const cart = useCart();

  // Focus barcode input on mount and after actions
  const focusBarcodeInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    // Check for existing token
    const token = posApi.getToken();
    if (token) {
      setView('cart');
      focusBarcodeInput();
    }
  }, [focusBarcodeInput]);

  // Handle barcode/SKU input
  const handleBarcodeSubmit = async () => {
    const sku = barcodeInput.trim().toUpperCase();
    if (!sku) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const product = await posApi.lookupProduct(sku);
      if (!product.inStock) {
        setError(`المنتج "${product.nameAr}" غير متوفر في المخزون`);
      } else {
        cart.addItem({
          sku: product.sku,
          nameAr: product.nameAr,
          unitPriceIqd: product.salePriceIqd,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'المنتج غير موجود');
    } finally {
      setBarcodeInput('');
      setIsLoading(false);
      focusBarcodeInput();
    }
  };

  // Handle payment (checkout)
  const handleCheckout = async () => {
    if (cart.isEmpty) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const order = await posApi.createOrder({
        items: cart.items.map((item) => ({
          sku: item.sku,
          quantity: item.quantity,
        })),
      });

      setLastOrder(order);
      cart.clearCart();
      setView('receipt');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إتمام الطلب');
      focusBarcodeInput();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const response = await posApi.login(phone, password);
      setCashierName(response.user.fullName);
      setView('cart');
      focusBarcodeInput();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  // New sale after receipt
  const handleNewSale = () => {
    setLastOrder(null);
    setView('cart');
    focusBarcodeInput();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (view !== 'cart') {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape = Clear cart
      if (e.key === 'Escape') {
        e.preventDefault();
        cart.clearCart();
        focusBarcodeInput();
      }
      // F2 = Focus barcode input
      if (e.key === 'F2') {
        e.preventDefault();
        focusBarcodeInput();
      }
      // F12 = Checkout (if cart not empty)
      if (e.key === 'F12' && !cart.isEmpty) {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, cart, focusBarcodeInput]);

  // Login view
  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">نقطة البيع</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXXX"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>
            {loginError && <div className="text-red-500 text-sm text-center">{loginError}</div>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Receipt view
  if (view === 'receipt' && lastOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
            <h1 className="text-2xl font-bold">تم إتمام البيع</h1>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">رقم الفاتورة</p>
              <p className="text-xl font-mono font-bold">{lastOrder.orderNumber}</p>
            </div>

            <div className="border-t pt-4 space-y-2">
              {lastOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {item.nameAr} x{item.quantity}
                  </span>
                  <span>{item.totalIqd.toLocaleString()} د.ع</span>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>الإجمالي</span>
                <span>{lastOrder.totalIqd.toLocaleString()} د.ع</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNewSale}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
          >
            بيع جديد (Enter)
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">اضغط Enter لبدء بيع جديد</p>
        </div>
      </div>
    );
  }

  // Main POS view (cart)
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">نقطة البيع</h1>
        </div>
        <div className="text-sm text-gray-500">
          {cashierName && <span>الكاشير: {cashierName}</span>}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Left: Barcode input & Product list */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Barcode input */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Barcode className="w-6 h-6 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeSubmit();
                  }
                }}
                placeholder="امسح الباركود أو أدخل رمز المنتج..."
                className="flex-1 text-lg py-2 px-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                autoFocus
                disabled={isLoading}
              />
              {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Cart items */}
          <div className="bg-white rounded-lg shadow flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-medium">السلة ({cart.itemCount} عنصر)</h2>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {cart.isEmpty ? (
                <div className="text-center text-gray-400 py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>السلة فارغة</p>
                  <p className="text-sm mt-1">امسح باركود المنتج للبدء</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <CartItemRow
                      key={item.sku}
                      item={item}
                      onIncrement={() => cart.incrementQuantity(item.sku)}
                      onDecrement={() => cart.decrementQuantity(item.sku)}
                      onRemove={() => cart.removeItem(item.sku)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Summary & Actions */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Total */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">الإجمالي</p>
              <p className="text-4xl font-bold">{cart.subtotal.toLocaleString()}</p>
              <p className="text-lg text-gray-500">د.ع</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleCheckout}
              disabled={cart.isEmpty || isLoading}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              دفع (F12)
            </button>

            <button
              onClick={cart.clearCart}
              disabled={cart.isEmpty}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
            >
              مسح السلة (Esc)
            </button>
          </div>

          {/* Shortcuts help */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <p className="font-medium mb-2">اختصارات لوحة المفاتيح:</p>
            <ul className="space-y-1">
              <li>
                <kbd className="bg-gray-200 px-1 rounded">Enter</kbd> إضافة المنتج
              </li>
              <li>
                <kbd className="bg-gray-200 px-1 rounded">F12</kbd> دفع
              </li>
              <li>
                <kbd className="bg-gray-200 px-1 rounded">Esc</kbd> مسح السلة
              </li>
              <li>
                <kbd className="bg-gray-200 px-1 rounded">F2</kbd> التركيز على الباركود
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart item row component
function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  const lineTotal = item.unitPriceIqd * item.quantity;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.nameAr}</p>
        <p className="text-sm text-gray-500">
          {item.unitPriceIqd.toLocaleString()} د.ع × {item.quantity}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onDecrement} className="p-1 rounded bg-gray-200 hover:bg-gray-300">
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button onClick={onIncrement} className="p-1 rounded bg-gray-200 hover:bg-gray-300">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="text-left min-w-20">
        <p className="font-bold">{lineTotal.toLocaleString()}</p>
        <p className="text-xs text-gray-500">د.ع</p>
      </div>

      <button onClick={onRemove} className="p-1 rounded text-red-500 hover:bg-red-50">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
