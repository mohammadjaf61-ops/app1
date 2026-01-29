module.exports = {
  extends: [require.resolve('@hypermarket/eslint-config')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
