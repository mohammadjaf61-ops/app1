/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./index.js')],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // ============================================
    // BACKEND-SPECIFIC TYPESCRIPT
    // ============================================
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',

    // ============================================
    // BACKEND SECURITY
    // ============================================
    // SQL Injection Prevention
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-child-process': 'warn',

    // ============================================
    // BACKEND CODE QUALITY
    // ============================================
    'sonarjs/cognitive-complexity': ['warn', 20],
    'max-lines-per-function': [
      'warn',
      { max: 150, skipBlankLines: true, skipComments: true },
    ],

    // Allow console in backend for logging (but prefer Logger)
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

    // ============================================
    // ASYNC PATTERNS
    // ============================================
    'require-await': 'error',
    'no-return-await': 'error',
    '@typescript-eslint/promise-function-async': 'off',

    // ============================================
    // ERROR HANDLING
    // ============================================
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
  },
  overrides: [
    {
      // Test files have relaxed rules
      files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines-per-function': 'off',
        'sonarjs/no-duplicate-string': 'off',
      },
    },
    {
      // DTOs can have many properties
      files: ['**/dto/**/*.ts', '**/*.dto.ts'],
      rules: {
        'max-lines-per-function': 'off',
      },
    },
    {
      // Entities/Models
      files: ['**/entities/**/*.ts', '**/*.entity.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
