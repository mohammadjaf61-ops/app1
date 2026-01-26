module.exports = {
  extends: [require.resolve('@hypermarket/eslint-config/nextjs')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
