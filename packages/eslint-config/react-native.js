/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./index.js')],
  plugins: ['react', 'react-hooks', 'react-native'],
  env: {
    'react-native/react-native': true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // ============================================
    // REACT RULES
    // ============================================
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/no-children-prop': 'warn',
    'react/no-danger': 'error',
    'react/no-deprecated': 'warn',
    'react/no-direct-mutation-state': 'error',
    'react/no-unescaped-entities': 'warn',
    'react/self-closing-comp': 'warn',
    'react/jsx-curly-brace-presence': [
      'warn',
      { props: 'never', children: 'never' },
    ],

    // ============================================
    // REACT HOOKS
    // ============================================
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ============================================
    // REACT NATIVE SPECIFIC
    // ============================================
    'react-native/no-unused-styles': 'warn',
    'react-native/no-inline-styles': 'off', // NativeWind uses inline
    'react-native/no-color-literals': 'off', // NativeWind handles colors
    'react-native/no-raw-text': 'off',
    'react-native/no-single-element-style-arrays': 'warn',

    // ============================================
    // MOBILE SECURITY
    // ============================================
    // Prevent hardcoded sensitive data
    'no-secrets/no-secrets': 'off', // Would need plugin

    // ============================================
    // MOBILE PERFORMANCE
    // ============================================
    // Relaxed complexity for UI components
    'sonarjs/cognitive-complexity': ['warn', 20],
    'max-lines-per-function': [
      'warn',
      { max: 200, skipBlankLines: true, skipComments: true },
    ],

    // Allow console for development (but strip in prod)
    'no-console': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      // Screen components can be larger
      files: ['**/screens/**/*.tsx', '**/*Screen.tsx'],
      rules: {
        'max-lines-per-function': 'off',
      },
    },
    {
      // Store files
      files: ['**/stores/**/*.ts', '**/*-store.ts'],
      rules: {
        'sonarjs/cognitive-complexity': 'off',
      },
    },
  ],
};
