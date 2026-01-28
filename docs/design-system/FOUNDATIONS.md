# Design System Foundations

Hypermarket Platform Design System - الأساس التصميمي الموحد

## Overview

This document defines the design tokens and micro-interactions used across the Hypermarket platform (Mobile RN + Admin Web).

**Philosophy:**
- Minimal, purposeful animations
- Performance first
- RTL-native
- Consistent across platforms

---

## Design Tokens

All tokens are defined in `@hypermarket/design-tokens` and shared between platforms.

### Installation

```typescript
import { colors, spacing, typography, radius } from '@hypermarket/design-tokens';
```

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `primary.500` | `#3B82F6` | Main brand color, primary actions |
| `primary.600` | `#2563EB` | Hover/pressed states |
| `neutral.900` | `#0F172A` | Primary text |
| `neutral.600` | `#475569` | Secondary text |
| `neutral.200` | `#E2E8F0` | Borders, dividers |
| `status.success.main` | `#22C55E` | Success states |
| `status.error.main` | `#EF4444` | Error states |
| `status.warning.main` | `#F59E0B` | Warning states |

### Typography

| Style | Font Size | Weight | Usage |
|-------|-----------|--------|-------|
| `heading.lg` | 24px | Semibold | Page titles |
| `heading.md` | 20px | Semibold | Section headers |
| `body.md` | 16px | Normal | Body text |
| `body.sm` | 14px | Normal | Secondary text |
| `label.md` | 14px | Medium | Form labels |
| `button.md` | 16px | Semibold | Button text |

### Spacing

Based on 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `spacing[1]` | 4px | Tight spacing |
| `spacing[2]` | 8px | Icon gaps |
| `spacing[4]` | 16px | Component padding |
| `spacing[6]` | 24px | Section spacing |
| `spacing[8]` | 32px | Large spacing |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius.sm` | 4px | Small elements |
| `radius.md` | 8px | Buttons, inputs |
| `radius.lg` | 12px | Cards |
| `radius.full` | 9999px | Pills, avatars |

---

## Micro-Interactions

We use exactly **3 micro-interactions** to enhance UX without overwhelming:

### 1. Add-to-Cart Feedback

**What:** Scale pulse + haptic feedback when adding item to cart
**When:** User taps "Add to Cart" button
**How:**
- Scale: 1 → 1.05 → 1 (spring animation)
- Duration: 250ms
- Haptic: Success notification (if available)
- Visual: Brief green color flash

```tsx
import { AddToCartButton } from '@hypermarket/mobile-ui';

<AddToCartButton
  label="أضف للسلة"
  price="5,000 د.ع"
  onPress={handleAddToCart}
/>
```

### 2. Screen Transitions

**What:** Subtle fade + slide for screen/element entry
**When:** Navigation, list loading, modal entry
**How:**
- Opacity: 0 → 1
- Translate: 20px → 0
- Duration: 250ms
- Easing: Decelerate curve

```tsx
import { FadeInView, StaggeredList } from '@hypermarket/mobile-ui';

// Single element
<FadeInView slide="up">
  <ProductCard />
</FadeInView>

// Staggered list
<StaggeredList staggerDelay={50}>
  {items.map(item => <ListItem key={item.id} item={item} />)}
</StaggeredList>
```

### 3. Loading Skeletons

**What:** Animated placeholder while content loads
**When:** API calls, image loading, initial render
**How:**
- Shimmer animation: opacity 0.3 → 0.7 → 0.3
- Duration: 2000ms (1s per direction)
- Background: neutral.200

```tsx
import { Skeleton, SkeletonProductGrid } from '@hypermarket/mobile-ui';

// Custom skeleton
<Skeleton width={200} height={20} />

// Pre-composed layouts
<SkeletonProductGrid />
<SkeletonListItem />
```

---

## When to Add Animation

**DO animate:**
- User-initiated actions (button press, add to cart)
- Content loading (skeleton → real content)
- Navigation transitions
- State changes that need attention

**DON'T animate:**
- Every scroll interaction
- Background data updates
- Error states (show immediately)
- Critical information

---

## Accessibility

### Touch Targets
- Minimum: 44px × 44px
- Recommended: 48px × 48px
- Achieved via `space.touchTarget` token

### Color Contrast
- All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- Status colors tested against backgrounds

### Motion
- Animations are short (<300ms)
- No parallax or complex motion
- Respects reduced motion preferences (future)

---

## RTL Support

- All components are RTL-first
- `flexDirection: 'row-reverse'` for horizontal layouts
- `textAlign: 'right'` for text
- Slide animations respect reading direction

---

## Platform Differences

| Feature | RN Mobile | Web Admin |
|---------|-----------|-----------|
| Haptics | ✅ expo-haptics | N/A |
| Skeleton | Animated.Value | CSS animation |
| Tokens | StyleSheet | Tailwind |
| Spring animations | Animated.spring | CSS transitions |

---

## File Structure

```
packages/
├── design-tokens/
│   └── src/
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       ├── radius.ts
│       ├── animation.ts
│       ├── shadows.ts
│       └── index.ts
└── mobile-ui/
    └── src/
        └── components/
            ├── AddToCartButton.tsx  # Micro-interaction #1
            ├── FadeInView.tsx       # Micro-interaction #2
            ├── Skeleton.tsx         # Micro-interaction #3
            └── AnimatedPressable.tsx
```

---

## Changelog

### v0.0.1 (2026-01-28)
- Initial design tokens package
- 3 core micro-interactions
- RTL-first components
