/** @type {import('next').NextConfig} */
let rawBackend = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:8081/api/v1';

if (rawBackend.endsWith('/:path*')) {
  // already formatted
} else if (rawBackend.endsWith('/api/v1') || rawBackend.endsWith('/api/v1/')) {
  rawBackend = rawBackend.replace(/\/+$/, '') + '/:path*';
} else {
  rawBackend = rawBackend.replace(/\/+$/, '') + '/api/v1/:path*';
}

const backendBase = process.env.BACKEND_BASE_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') : 'http://backend:8081');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: rawBackend,
      },
      {
        source: '/api/:path*',
        destination: rawBackend,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendBase}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
