const { colors } = require('@hypermarket/design-tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Arabic fonts with fallback
        sans: ['DecotypeNaskh', 'AlArabiya'],
        heading: ['AlArabiya'],
        body: ['DecotypeNaskh'],
        ui: ['AlArabiya'],
        naskh: ['DecotypeNaskh'],
        arabiya: ['AlArabiya'],
      },
      colors: {
        primary: {
          DEFAULT: colors.primary[500],
          50: colors.primary[50],
          100: colors.primary[100],
          200: colors.primary[200],
          300: colors.primary[300],
          400: colors.primary[400],
          500: colors.primary[500],
          600: colors.primary[600],
          700: colors.primary[700],
          800: colors.primary[800],
          900: colors.primary[900],
        },
        gray: {
          50: colors.neutral[50],
          100: colors.neutral[100],
          200: colors.neutral[200],
          300: colors.neutral[300],
          400: colors.neutral[400],
          500: colors.neutral[500],
          600: colors.neutral[600],
          700: colors.neutral[700],
          800: colors.neutral[800],
          900: colors.neutral[900],
        },
      },
    },
  },
  plugins: [],
};
