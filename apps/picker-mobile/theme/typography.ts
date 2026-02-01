export const fontHeading = 'AlArabiya';
export const fontBody = 'DecotypeNaskh';
export const fontUI = 'AlArabiya';

const baseScale = {
  h1: { fontSize: 30, lineHeight: 42 },
  h2: { fontSize: 24, lineHeight: 34 },
  h3: { fontSize: 20, lineHeight: 30 },
  body: { fontSize: 16, lineHeight: 26 },
  caption: { fontSize: 12, lineHeight: 18 },
} as const;

export const typeScale = {
  ...baseScale,
  xs: baseScale.caption,
  sm: baseScale.caption,
  base: baseScale.body,
  lg: baseScale.body,
  xl: baseScale.h3,
  '2xl': baseScale.h2,
  '3xl': baseScale.h1,
} as const;

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
