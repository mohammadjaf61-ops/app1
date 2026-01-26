/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9', // Sky blue for driver app
        'primary-dark': '#0284c7',
        secondary: '#16a34a',
        warning: '#f59e0b',
        danger: '#ef4444',
        success: '#22c55e',
      },
    },
  },
  plugins: [],
};
