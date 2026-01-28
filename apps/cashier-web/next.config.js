/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@hypermarket/i18n',
    '@hypermarket/shared-types',
  ],
};

module.exports = nextConfig;
