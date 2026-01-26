/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hypermarket/shared-types', '@hypermarket/shared-utils'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
    ],
  },
  // Enable experimental features if needed
  experimental: {
    // serverActions: true,
  },
};

module.exports = nextConfig;
