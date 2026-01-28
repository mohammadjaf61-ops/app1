module.exports = {
  extends: [require.resolve('@hypermarket/eslint-config/react-native')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
