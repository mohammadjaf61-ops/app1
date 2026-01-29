# Arabic Fonts

Place the following font files in this directory:

1. `decotype-naskh-special.ttf` - Primary Arabic font (DecotypeNaskh)
2. `ae_AlArabiya.ttf` - Secondary Arabic font (AlArabiya)

## Font Stack Priority

The application uses the following font priority:
1. DecotypeNaskh (Custom)
2. AlArabiya (Custom)
3. Noto Kufi Arabic (Google Fonts - loaded from CDN)
4. System UI fallback

## Usage in CSS

```css
/* Primary Arabic font */
font-family: var(--font-arabic-primary);

/* Secondary Arabic font */
font-family: var(--font-arabic-secondary);

/* Default font stack (includes all) */
font-family: var(--font-noto-kufi);
```

## Usage in Tailwind

```html
<!-- Primary font -->
<p class="font-arabic-primary">نص بالخط الأساسي</p>

<!-- Secondary font -->
<p class="font-arabic-secondary">نص بالخط الثانوي</p>
```
