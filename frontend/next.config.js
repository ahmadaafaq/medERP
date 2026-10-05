/** @type {import('next').NextConfig} */
const publicApi = (process.env.NEXT_PUBLIC_API_URL || '').trim();
const hasPublicIp = publicApi && !publicApi.includes('localhost') && !publicApi.includes('127.0.0.1');

const backendHost = process.env.BACKEND_HOST || '100.63.22.73';
const backendPort = process.env.BACKEND_PORT || process.env.PORT || '8081';
const defaultBase = `http://${backendHost}:${backendPort}`;

// When NEXT_PUBLIC_API_URL is configured (e.g. http://100.63.22.73:8081/api/v1), prioritize it!
let rawBackend = (hasPublicIp ? publicApi : null) || process.env.BACKEND_INTERNAL_URL || publicApi || `${defaultBase}/api/v1`;

if (rawBackend.endsWith('/:path*')) {
  // already formatted
} else if (rawBackend.endsWith('/api/v1') || rawBackend.endsWith('/api/v1/')) {
  rawBackend = rawBackend.replace(/\/+$/, '') + '/:path*';
} else {
  rawBackend = rawBackend.replace(/\/+$/, '') + '/api/v1/:path*';
}

let backendBase = (hasPublicIp ? publicApi.replace(/\/api\/v1\/?$/, '') : null) || process.env.BACKEND_BASE_URL || (publicApi ? publicApi.replace(/\/api\/v1\/?$/, '') : defaultBase);

// Only if user explicitly passed localhost:8081, normalize to 127.0.0.1 for server-side proxying to prevent Windows Node IPv6 ::1 ECONNREFUSED
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
