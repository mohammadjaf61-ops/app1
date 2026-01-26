/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./index.js')],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
  },
};
