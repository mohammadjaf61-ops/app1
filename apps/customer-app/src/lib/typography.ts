import { StyleSheet } from 'react-native';

import { fonts } from './fonts';

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const textStyles = StyleSheet.create({
  h1: {
    fontFamily: fonts.arabic,
    fontSize: 28,
    fontWeight: fontWeights.bold,
    lineHeight: 36,
  },
  h2: {
    fontFamily: fonts.arabic,
    fontSize: 24,
    fontWeight: fontWeights.bold,
    lineHeight: 32,
  },
  h3: {
    fontFamily: fonts.arabic,
    fontSize: 20,
    fontWeight: fontWeights.semiBold,
    lineHeight: 28,
  },
  h4: {
    fontFamily: fonts.arabic,
    fontSize: 18,
    fontWeight: fontWeights.semiBold,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.arabic,
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fonts.arabic,
    fontSize: 16,
    fontWeight: fontWeights.medium,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontFamily: fonts.arabic,
    fontSize: 16,
    fontWeight: fontWeights.semiBold,
    lineHeight: 24,
  },
  small: {
    fontFamily: fonts.arabic,
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
  },
  smallMedium: {
    fontFamily: fonts.arabic,
    fontSize: 14,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
  },
  xs: {
    fontFamily: fonts.arabic,
    fontSize: 12,
    fontWeight: fontWeights.regular,
    lineHeight: 16,
  },
  xsMedium: {
    fontFamily: fonts.arabic,
    fontSize: 12,
    fontWeight: fontWeights.medium,
    lineHeight: 16,
  },
  label: {
    fontFamily: fonts.arabic,
    fontSize: 14,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
  },
  button: {
    fontFamily: fonts.arabic,
    fontSize: 16,
    fontWeight: fontWeights.semiBold,
    lineHeight: 24,
  },
});
