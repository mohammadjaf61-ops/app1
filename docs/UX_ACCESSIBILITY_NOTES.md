# UX & Accessibility Notes

## Overview

This document outlines the UX polish and accessibility features implemented in the Hypermarket Platform admin dashboard, with special attention to Arabic language support and RTL layout.

## Accessibility Standards

The platform follows WCAG 2.1 Level AA guidelines:

### Touch Targets (WCAG 2.5.5)

All interactive elements meet minimum touch target requirements:

| Element | Minimum Size |
|---------|-------------|
| Buttons (default) | 44px × 44px |
| Buttons (large) | 48px × 48px |
| Icon buttons | 44px × 44px |
| Form inputs | 44px height |
| Links (in touch context) | 44px tap area |

**Implementation:**
```css
:root {
  --touch-target: 44px;
  --touch-target-lg: 48px;
}

.touch-target {
  min-height: var(--touch-target);
  min-width: var(--touch-target);
}
```

### Color Contrast

- All text meets 4.5:1 contrast ratio (AA)
- Large text meets 3:1 contrast ratio
- Interactive elements have visible focus states
- Error states use sufficient contrast with background

### Focus Management

- All interactive elements are keyboard accessible
- Focus order follows visual layout (RTL-aware)
- Focus indicators use 2px ring with offset
- Skip link available for keyboard navigation

**Skip Link:**
```html
<a href="#main-content" class="skip-link">
  تخطي إلى المحتوى الرئيسي
</a>
```

### Screen Reader Support

- Semantic HTML elements used throughout
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content
- Role and state attributes for custom components

## Arabic Language Support

### Font Stack

The platform uses a prioritized Arabic font stack:

1. **DecotypeNaskh** (Custom) - Primary decorative Arabic font
2. **AlArabiya** (Custom) - Secondary Arabic font
3. **Noto Kufi Arabic** (Google Fonts) - Fallback
4. **System UI** - Ultimate fallback

**CSS Variables:**
```css
--font-arabic-primary: 'DecotypeNaskh', 'Noto Kufi Arabic', system-ui;
--font-arabic-secondary: 'AlArabiya', 'Noto Kufi Arabic', system-ui;
--font-noto-kufi: 'DecotypeNaskh', 'AlArabiya', 'Noto Kufi Arabic', system-ui;
```

### RTL Layout

The entire application uses RTL layout:

```html
<html lang="ar" dir="rtl">
```

**RTL Utilities:**
```css
/* Manual RTL flip */
.rtl-flip {
  transform: scaleX(-1);
}

/* Auto-flip in RTL context */
[dir='rtl'] .rtl-auto-flip {
  transform: scaleX(-1);
}
```

### Icons That Need Flipping in RTL

The following icons should be flipped in RTL mode:
- Arrow icons (→ becomes ←)
- Navigation icons (chevron-left/right)
- Progress indicators
- Reply/forward icons

**Example:**
```tsx
<ChevronRight className="rtl-flip h-4 w-4" />
```

### Currency Formatting

Iraqi Dinar (IQD) formatting:

```tsx
// Utility function
const formatIQD = (amount: number): string => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' د.ع';
};

// CSS class
<span className="currency-iqd">{amount}</span>
```

## UI Components

### Empty States

Use the `EmptyState` component for empty lists/sections:

```tsx
import { EmptyState } from '@/components/ui/empty-state';

<EmptyState
  icon={Package}
  title="لا توجد منتجات"
  description="لم يتم إضافة أي منتجات بعد"
  actionLabel="إضافة منتج"
  onAction={() => router.push('/products/new')}
/>
```

### Error States

Use the `ErrorState` component for error displays:

```tsx
import { ErrorState } from '@/components/ui/error-state';

<ErrorState
  title="حدث خطأ"
  message="فشل في تحميل البيانات"
  severity="error"
  onRetry={() => refetch()}
/>
```

### Loading States

Use `LoadingButton` for async actions:

```tsx
import { LoadingButton } from '@/components/ui/loading-button';

<LoadingButton
  loading={isSubmitting}
  onClick={handleSubmit}
>
  حفظ التغييرات
</LoadingButton>
```

### Confirmation Dialogs

Use `ConfirmDialog` and `useConfirmDialog` hook:

```tsx
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';

const { confirm, dialogProps } = useConfirmDialog();

const handleDelete = () => {
  confirm({
    title: 'حذف المنتج',
    description: 'هل أنت متأكد من حذف هذا المنتج؟',
    variant: 'destructive',
    onConfirm: async () => {
      await deleteProduct(id);
    },
  });
};

// In JSX
<ConfirmDialog {...dialogProps} />
```

### Offline Banner

The `OfflineBanner` component shows when network is unavailable:

```tsx
import { OfflineBanner } from '@/components/ui/offline-banner';

// Add to layout
<OfflineBanner />
```

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Move focus forward |
| `Shift + Tab` | Move focus backward |
| `Enter` | Activate focused element |
| `Escape` | Close modal/dropdown |
| `Space` | Toggle checkbox/button |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Alt + 1` | Go to Dashboard |
| `Alt + 2` | Go to Products |
| `Alt + 3` | Go to Orders |
| `Alt + 4` | Go to Customers |
| `/` | Focus search (when available) |

### Data Tables

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate rows |
| `Enter` | Open selected row |
| `Delete` | Delete selected (with confirmation) |
| `Ctrl + A` | Select all |

### Forms

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save form |
| `Escape` | Cancel/close form |
| `Tab` | Next field |
| `Shift + Tab` | Previous field |

## Motion & Animation

### Reduced Motion Support

The platform respects user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Mode

Enhanced styles for high contrast preferences:

```css
@media (prefers-contrast: high) {
  .border {
    border-width: 2px;
  }

  :focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }
}
```

## Testing Checklist

### Accessibility Testing

- [ ] Test with keyboard-only navigation
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Verify touch targets on mobile
- [ ] Check color contrast ratios
- [ ] Verify focus order is logical
- [ ] Test with reduced motion enabled
- [ ] Test with high contrast mode

### RTL Testing

- [ ] Verify text alignment
- [ ] Check icon directions
- [ ] Verify form layouts
- [ ] Test navigation flow
- [ ] Check modal positioning
- [ ] Verify table layouts

### Arabic Text Testing

- [ ] Verify font rendering
- [ ] Check number formatting
- [ ] Verify currency display (IQD)
- [ ] Test date/time formatting
- [ ] Check text wrapping
- [ ] Verify input field behavior

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [RTL Styling 101](https://rtlstyling.com/)
- [Arabic Typography](https://design.google/library/arabic-type-design)
