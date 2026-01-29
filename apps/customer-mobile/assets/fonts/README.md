# Arabic Fonts for Customer Mobile App

Place the following font files in this directory:

1. `decotype-naskh-special.ttf` - Primary Arabic font (DecotypeNaskh)
2. `ae_AlArabiya.ttf` - Secondary Arabic font (AlArabiya)

## Font Configuration

The fonts are loaded in `app/_layout.tsx` using expo-font:

```typescript
const [fontsLoaded, fontError] = useFonts({
  DecotypeNaskh: require('../assets/fonts/decotype-naskh-special.ttf'),
  AlArabiya: require('../assets/fonts/ae_AlArabiya.ttf'),
});
```

## Usage in NativeWind/Tailwind

The fonts are configured in `tailwind.config.js`:

```javascript
fontFamily: {
  sans: ['DecotypeNaskh', 'AlArabiya', 'NotoKufiArabic'],
  'arabic-primary': ['DecotypeNaskh'],
  'arabic-secondary': ['AlArabiya'],
  naskh: ['DecotypeNaskh'],
  arabiya: ['AlArabiya'],
}
```

### Usage Examples

```tsx
// Default font (DecotypeNaskh)
<Text className="font-sans">نص عربي</Text>

// Explicit primary font
<Text className="font-naskh">خط ديكوتايب نسخ</Text>

// Secondary font
<Text className="font-arabiya">خط العربية</Text>
```

## Font Weights

Configure font weights by providing multiple font files:

```
decotype-naskh-special.ttf     -> Regular (400)
decotype-naskh-special-bold.ttf -> Bold (700)
```

Update the font loading in `_layout.tsx` for additional weights:

```typescript
const [fontsLoaded] = useFonts({
  'DecotypeNaskh-Regular': require('../assets/fonts/decotype-naskh-special.ttf'),
  'DecotypeNaskh-Bold': require('../assets/fonts/decotype-naskh-special-bold.ttf'),
  // ... other weights
});
```

## Fallback Chain

The font stack ensures graceful degradation:
1. DecotypeNaskh (Custom primary)
2. AlArabiya (Custom secondary)
3. NotoKufiArabic (System/bundled)
4. System default
