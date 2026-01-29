# ADR 0022: Customer Experience Completion (Cart, Checkout, Feedback Loop)

## Status

Accepted

## Context

The customer mobile app needed essential UX improvements to make it usable for daily operations. The focus was on practical, clear interactions for Cart, Checkout, and Order Confirmation flows - without over-engineering or adding unnecessary features.

### Requirements

| Area | Requirement |
|------|-------------|
| Cart UX | Visual item count badge, quantity controls, removal confirmation |
| Checkout UX | Clear summary, loading states, error handling |
| Confirmation | Order success screen with details and next steps |
| Feedback | Toast notifications for all user actions |
| Error States | Clear error messages, no silent failures |

## Decision

We implemented targeted UX improvements following practical design principles:

### 1. Cart UX Improvements

**Cart Badge (Tab Icon):**
```typescript
function CartTabIcon({ color, size }) {
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <View>
      <ShoppingCart size={size} color={color} />
      {itemCount > 0 && (
        <View style={badgeStyle}>
          <Text>{itemCount > 99 ? '99+' : itemCount}</Text>
        </View>
      )}
    </View>
  );
}
```

**Quantity Controls with Feedback:**
- Plus/Minus buttons with immediate visual update
- Decrement at 1 triggers remove confirmation
- Remove button with confirmation dialog

**Cart Store (Zustand + AsyncStorage):**
```typescript
interface CartState {
  items: CartItem[];
  addItem: (item, quantity?) => void;
  removeItem: (productId) => void;
  updateQuantity: (productId, quantity) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
}
```

### 2. Checkout UX

**Form Validation:**
- Name, phone (Iraqi format 07XXXXXXXXX), address validation
- Inline error messages
- Disabled submit during processing

**Order Summary:**
- Item list with quantities
- Subtotal, delivery fee, total
- Payment method indicator (COD)

**Loading States:**
```typescript
<Pressable disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <ActivityIndicator />
      <Text>جاري إرسال الطلب...</Text>
    </>
  ) : (
    <Text>تأكيد الطلب</Text>
  )}
</Pressable>
```

**Error Handling:**
```typescript
const ERROR_MESSAGES = {
  'errors.productNotAvailable': 'بعض المنتجات غير متوفرة حالياً',
  'errors.outOfStock': 'المنتج نفذ من المخزون',
  'errors.priceChanged': 'تغير سعر المنتج، يرجى مراجعة السلة',
};
```

### 3. Order Confirmation Screen

**Success State:**
- Order number display
- Order status indicator
- Total amount
- Payment method confirmation

**Next Steps Guide:**
- Clear numbered steps explaining what happens next
- Navigation to Orders list or Home

### 4. Toast Notification System

**Custom Toast Provider:**
```typescript
type ToastType = 'success' | 'error' | 'warning' | 'info';

function useToast() {
  return { showToast: (message, type) => void };
}

// Usage
showToast('تمت إضافة المنتج إلى السلة', 'success');
showToast('فشل في إنشاء الطلب', 'error');
```

**Toast Types:**
| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| success | Green | CheckCircle | Add to cart, order success |
| error | Red | XCircle | API errors, validation |
| warning | Amber | AlertCircle | Stock issues, offline |
| info | Blue | Info | Item removed, cart cleared |

### 5. Add to Cart Flow

**Home Screen Integration:**
- Product cards with Add button
- Quantity badge on products in cart
- Toast on add to cart

```typescript
const handleAddToCart = () => {
  addItem({
    productId: product.id,
    sku: product.sku,
    nameAr: product.nameAr,
    price: product.price,
  });
  showToast(`تمت إضافة "${product.nameAr}" إلى السلة`, 'success');
};
```

## Implementation Files

### New Files Created

| File | Purpose |
|------|---------|
| `apps/customer-mobile/lib/constants.ts` | App constants, delivery fee, status labels |
| `apps/customer-mobile/lib/formatters.ts` | Currency, date, phone formatting |
| `apps/customer-mobile/stores/cart-store.ts` | Zustand cart state management |
| `apps/customer-mobile/components/Toast.tsx` | Toast notification system |
| `apps/customer-mobile/app/checkout.tsx` | Checkout screen |
| `apps/customer-mobile/app/order-confirmation.tsx` | Order confirmation screen |

### Modified Files

| File | Changes |
|------|---------|
| `apps/customer-mobile/app/_layout.tsx` | Added ToastProvider, checkout/confirmation routes |
| `apps/customer-mobile/app/tabs/_layout.tsx` | Added cart badge to tab icon |
| `apps/customer-mobile/app/tabs/cart/index.tsx` | Full cart implementation |
| `apps/customer-mobile/app/tabs/home/index.tsx` | Add to cart functionality |

## Consequences

### Positive

1. **User always knows what's happening** - Toast feedback for every action
2. **No silent failures** - Errors shown with clear Arabic messages
3. **Cart feels stable** - Persisted state, confirmation dialogs
4. **Clear checkout flow** - Summary, validation, loading states
5. **Order completion clarity** - Confirmation screen with next steps

### Negative

1. **Mock data for products** - Real API integration pending
2. **No offline support** - Requires network for orders

### User Scenarios Covered

| Scenario | Behavior |
|----------|----------|
| Add to cart | Toast: "تمت إضافة المنتج" |
| Update quantity | Immediate visual feedback |
| Remove item | Confirmation dialog, then toast |
| Clear cart | Confirmation dialog, then toast |
| Empty cart | Clear message + "Browse Products" CTA |
| Checkout validation | Inline errors, highlighted fields |
| Order processing | Loading state, disabled button |
| Order success | Confirmation screen with order details |
| Order failure | Error toast with specific message |
| Stock unavailable | Warning toast, guidance to review cart |

## Related

- ADR 0021: Data Integrity, Constraints & Auditing
- `packages/mobile-core/` - Shared mobile utilities
- `apps/customer-app/` - Reference implementation (web version)
