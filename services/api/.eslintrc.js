module.exports = {
  extends: [require.resolve('@hypermarket/eslint-config/nestjs')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
