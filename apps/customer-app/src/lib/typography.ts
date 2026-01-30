/**
 * Typography Baseline
 * Font weights and text styles for the app
 */

import { StyleSheet } from 'react-native';

import { fonts } from './fonts';

/**
 * Font weights mapping
 * Using DecotypeNaskh as primary Arabic font
 */
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

/**
 * Base text styles
 */
export const textStyles = StyleSheet.create({
  // Headings
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

  // Body
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

  // Small
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

  // Extra small
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

  // Labels & buttons
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
