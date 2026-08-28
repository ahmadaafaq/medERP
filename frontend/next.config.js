/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001/api/v1/:path*';
const backendBase = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3001';

const nextConfig = {
  output: process.env.NEXT_OUTPUT_STANDALONE === 'true' ? 'standalone' : undefined,
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: backendUrl,
      },
      {
        source: '/api/:path*',
        destination: backendUrl,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendBase}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
