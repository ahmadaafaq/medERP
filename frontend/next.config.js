/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Required for Next.js Docker standalone output in production only
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Disable webpack cache in development to prevent "Cannot find module" errors from cache desync
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // In Docker, proxy to backend service; falls back to localhost in dev
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
