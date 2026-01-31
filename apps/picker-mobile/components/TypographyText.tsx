import { Text, TextProps, StyleSheet } from 'react-native';

import { fontHeading, fontBody, fontUI, typeScale } from '../theme/typography';

type Variant = 'heading' | 'body' | 'ui' | 'caption';
type Size = keyof typeof typeScale;

interface TypographyTextProps extends TextProps {
  variant?: Variant;
  size?: Size;
  bold?: boolean;
}

const variantFonts: Record<Variant, string> = {
  heading: fontHeading,
  body: fontBody,
  ui: fontUI,
  caption: fontBody,
};

const defaultSizes: Record<Variant, Size> = {
  heading: 'xl',
  body: 'base',
  ui: 'sm',
  caption: 'xs',
};

export function TypographyText({
  variant = 'body',
  size,
  bold,
  style,
  children,
  ...props
}: TypographyTextProps) {
  const fontFamily = variantFonts[variant];
  const sizeKey = size || defaultSizes[variant];
  const { fontSize, lineHeight } = typeScale[sizeKey];

  return (
    <Text
      style={[
        styles.base,
        {
          fontFamily,
          fontSize,
          lineHeight,
          fontWeight: bold ? '700' : '400',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    textAlign: 'right',
  },
});
