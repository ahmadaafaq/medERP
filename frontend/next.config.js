/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:8081/api/v1/:path*';

const nextConfig = {
  output: 'standalone',
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
    ];
  },
};

module.exports = nextConfig;

