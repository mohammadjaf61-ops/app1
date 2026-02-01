/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DecotypeNaskh', 'AlArabiya'],
        heading: ['AlArabiya'],
        body: ['DecotypeNaskh'],
        ui: ['AlArabiya'],
      },
      colors: {
        primary: {
          DEFAULT: '#2E3A8C',
          50: '#F2F3FB',
          100: '#E3E7F6',
          200: '#C6CEF0',
          300: '#A1AEE3',
          400: '#6F80CC',
          500: '#2E3A8C',
          600: '#2A3280',
          700: '#242B72',
          800: '#1F255E',
          900: '#191E4B',
        },
        gray: {
          50: '#F9F7F3',
          100: '#F2EFE8',
          200: '#E6E1D8',
          300: '#D2CBBE',
          400: '#A9A091',
          500: '#857C6F',
          600: '#5F594F',
          700: '#47413A',
          800: '#2F2B26',
          900: '#1E1B17',
        },
      },
    },
  },
  plugins: [],
};
