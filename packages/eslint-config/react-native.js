/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./index.js')],
  plugins: ['react', 'react-hooks'],
  env: {
    'react-native/react-native': true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
