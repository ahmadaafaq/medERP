/** @type {import('next').NextConfig} */
let rawBackend = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081/api/v1';

if (rawBackend.endsWith('/:path*')) {
  // already formatted
} else if (rawBackend.endsWith('/api/v1') || rawBackend.endsWith('/api/v1/')) {
  rawBackend = rawBackend.replace(/\/+$/, '') + '/:path*';
} else {
  rawBackend = rawBackend.replace(/\/+$/, '') + '/api/v1/:path*';
}

let backendBase = process.env.BACKEND_BASE_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') : 'http://127.0.0.1:8081');

// Normalize localhost to IPv4 127.0.0.1 for server-side proxying to prevent Windows Node IPv6 ::1 ECONNREFUSED
if (rawBackend.includes('localhost:8081')) {
  rawBackend = rawBackend.replace('localhost:8081', '127.0.0.1:8081');
}
if (backendBase.includes('localhost:8081')) {
  backendBase = backendBase.replace('localhost:8081', '127.0.0.1:8081');
}

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
