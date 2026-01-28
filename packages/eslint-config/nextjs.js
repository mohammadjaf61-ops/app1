/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./index.js'), 'next/core-web-vitals'],
  plugins: ['react'],
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // ============================================
    // NEXT.JS SPECIFIC
    // ============================================
    '@next/next/no-html-link-for-pages': 'off',
    '@next/next/no-img-element': 'warn',

    // ============================================
    // REACT RULES
    // ============================================
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-children-prop': 'warn',
    'react/no-danger': 'error',
    'react/no-deprecated': 'warn',
    'react/no-direct-mutation-state': 'error',
    'react/self-closing-comp': 'warn',
    'react/jsx-curly-brace-presence': [
      'warn',
      { props: 'never', children: 'never' },
    ],
    'react/jsx-boolean-value': ['warn', 'never'],

    // ============================================
    // REACT HOOKS
    // ============================================
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ============================================
    // WEB SECURITY (XSS Prevention)
    // ============================================
    'react/no-danger-with-children': 'error',

    // ============================================
    // WEB PERFORMANCE
    // ============================================
    'sonarjs/cognitive-complexity': ['warn', 20],
    'max-lines-per-function': [
      'warn',
      { max: 150, skipBlankLines: true, skipComments: true },
    ],

    // Allow console in development
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      // Page components can be larger
      files: ['**/app/**/*.tsx', '**/pages/**/*.tsx'],
      rules: {
        'max-lines-per-function': 'off',
      },
    },
    {
      // Server components and API routes
      files: ['**/api/**/*.ts', '**/actions/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'warn',
      },
    },
    {
      // Components
      files: ['**/components/**/*.tsx'],
      rules: {
        'max-lines-per-function': [
          'warn',
          { max: 200, skipBlankLines: true, skipComments: true },
        ],
      },
    },
  ],
};
