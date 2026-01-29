# ADR 0034: UX Polish, Accessibility & Arabic Excellence

## Status

Accepted

## Date

2026-01-29

## Context

The Hypermarket Platform serves Iraqi customers with an Arabic-first interface. To ensure an excellent user experience, we need:

1. **Accessibility**: Meet WCAG 2.1 Level AA for users with disabilities
2. **Arabic Typography**: Custom Arabic fonts for brand identity
3. **RTL Support**: Proper right-to-left layout handling
4. **Unified UI Patterns**: Consistent components for common states

## Decision

### 1. Accessibility Standards (WCAG 2.1 AA)

#### Touch Targets
All interactive elements meet minimum 44x44px touch target size:

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

Button sizes updated:
- Default: 44px height
- Large: 48px height
- Icon: 44x44px

#### Keyboard Navigation
- Skip link for main content navigation
- Visible focus indicators (2px ring with offset)
- Logical focus order following visual layout

#### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### High Contrast Support
```css
@media (prefers-contrast: high) {
  .border { border-width: 2px; }
  :focus-visible { outline: 3px solid currentColor; }
}
```

### 2. Arabic Font Stack

Custom fonts with Google Fonts fallback:

```css
--font-arabic-primary: 'DecotypeNaskh', 'Noto Kufi Arabic', system-ui;
--font-arabic-secondary: 'AlArabiya', 'Noto Kufi Arabic', system-ui;
--font-noto-kufi: 'DecotypeNaskh', 'AlArabiya', 'Noto Kufi Arabic', system-ui;
```

**Web (Admin Dashboard)**:
- `@font-face` declarations for TTF files
- Google Fonts `@import` as CDN fallback
- Files in `/public/fonts/`

**Mobile (Customer App)**:
- `expo-font` for font loading
- Assets in `/assets/fonts/`
- SplashScreen held until fonts loaded

### 3. RTL Utilities

```css
/* Manual flip for directional icons */
.rtl-flip {
  transform: scaleX(-1);
}

/* Auto-flip in RTL context */
[dir='rtl'] .rtl-auto-flip {
  transform: scaleX(-1);
}

/* Currency formatting */
.currency-iqd::after {
  content: ' د.ع';
}
```

Icons that need flipping:
- Arrow icons (chevron-left, chevron-right)
- Navigation icons
- Progress indicators

### 4. Unified UI Components

| Component | Purpose |
|-----------|---------|
| `EmptyState` | Empty lists/sections with optional CTA |
| `ErrorState` | Error display with severity (error/warning/info) |
| `OfflineBanner` | Network connectivity indicator |
| `LoadingButton` | Button with loading spinner |
| `ConfirmDialog` | Confirmation dialogs with hook |

All components include:
- ARIA attributes (`role`, `aria-live`, `aria-label`)
- Touch target compliance
- RTL-aware layouts

## File Structure

```
apps/admin-web/
├── public/fonts/
│   ├── decotype-naskh-special.ttf
│   ├── ae_AlArabiya.ttf
│   └── README.md
├── src/
│   ├── styles/globals.css          # Font faces, utilities
│   ├── components/ui/
│   │   ├── empty-state.tsx
│   │   ├── error-state.tsx
│   │   ├── offline-banner.tsx
│   │   ├── loading-button.tsx
│   │   └── confirm-dialog.tsx
│   └── app/layout.tsx              # Skip link

apps/customer-mobile/
├── assets/fonts/
│   ├── decotype-naskh-special.ttf
│   ├── ae_AlArabiya.ttf
│   └── README.md
└── app/_layout.tsx                  # Font loading

docs/
└── UX_ACCESSIBILITY_NOTES.md       # Guidelines
```

## Consequences

### Positive
- WCAG 2.1 AA compliance
- Consistent Arabic typography across platforms
- Reusable UI components reduce code duplication
- Better experience for users with disabilities
- Brand identity through custom fonts

### Negative
- Font files increase bundle size (~200KB)
- Additional complexity in mobile font loading
- Maintenance of multiple font variants

### Neutral
- Google Fonts fallback ensures graceful degradation
- CSS utilities add minimal overhead

## Alternatives Considered

1. **System fonts only**: Rejected - inconsistent Arabic rendering
2. **Google Fonts exclusively**: Rejected - custom fonts needed for brand
3. **CSS framework (Chakra, MUI)**: Rejected - already using Tailwind
4. **External accessibility testing service**: Could be added later

## Testing Requirements

### Accessibility Testing
- [ ] Keyboard-only navigation
- [ ] Screen reader (NVDA/VoiceOver)
- [ ] Touch target verification (44px minimum)
- [ ] Color contrast ratios (4.5:1 AA)
- [ ] Reduced motion mode
- [ ] High contrast mode

### RTL Testing
- [ ] Text alignment
- [ ] Icon directions
- [ ] Form layouts
- [ ] Modal positioning

### Arabic Text Testing
- [ ] Font rendering quality
- [ ] Number formatting
- [ ] Currency display (IQD)
- [ ] Date/time formatting

## References

- PR#34: UX Polish, Accessibility & Arabic Excellence
- `docs/UX_ACCESSIBILITY_NOTES.md`
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [RTL Styling 101](https://rtlstyling.com/)
