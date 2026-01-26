/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'prettier',
    'security',
    'sonarjs',
    'unicorn',
    'promise',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended-legacy',
    'plugin:sonarjs/recommended',
    'plugin:promise/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    // ============================================
    // PRETTIER
    // ============================================
    'prettier/prettier': 'error',

    // ============================================
    // TYPESCRIPT
    // ============================================
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      { prefer: 'type-imports' },
    ],

    // ============================================
    // IMPORT ORDER
    // ============================================
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'off',
    'import/no-duplicates': 'error',
    'import/no-cycle': 'warn',
    'import/no-self-import': 'error',

    // ============================================
    // SECURITY (OWASP Top 10 Prevention)
    // ============================================
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'warn',

    // ============================================
    // CODE QUALITY (SonarJS)
    // ============================================
    'sonarjs/cognitive-complexity': ['warn', 15],
    'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
    'sonarjs/no-identical-functions': 'warn',
    'sonarjs/no-collapsible-if': 'warn',
    'sonarjs/prefer-immediate-return': 'warn',
    'sonarjs/no-redundant-jump': 'error',

    // ============================================
    // UNICORN (Best Practices)
    // ============================================
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/filename-case': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/no-useless-undefined': 'warn',
    'unicorn/prefer-ternary': 'off',
    'unicorn/no-nested-ternary': 'warn',
    'unicorn/prefer-string-slice': 'warn',
    'unicorn/prefer-array-find': 'warn',
    'unicorn/prefer-includes': 'warn',
    'unicorn/throw-new-error': 'error',

    // ============================================
    // PROMISE HANDLING
    // ============================================
    'promise/always-return': 'off',
    'promise/catch-or-return': 'warn',
    'promise/no-nesting': 'warn',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',

    // ============================================
    // GENERAL
    // ============================================
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'warn',
    'no-nested-ternary': 'off', // handled by unicorn
    'no-unneeded-ternary': 'warn',
    'no-lonely-if': 'warn',
    'no-else-return': ['warn', { allowElseIf: false }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    curly: ['error', 'all'],
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'no-return-await': 'warn',
    'require-await': 'warn',
    'no-await-in-loop': 'warn',
    'no-param-reassign': ['warn', { props: false }],
    'max-depth': ['warn', 4],
    'max-lines-per-function': [
      'warn',
      { max: 100, skipBlankLines: true, skipComments: true },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    '.expo/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
  ],
};
