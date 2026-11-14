/** @type {import('next').NextConfig} */
const path = require('path');
const publicApi = (process.env.NEXT_PUBLIC_API_URL || '').trim();

// Dynamically pick host from BACKEND_HOST (no hardcoded IP)
const backendHost = process.env.BACKEND_HOST || '127.0.0.1';
const backendPort = process.env.BACKEND_PORT || process.env.PORT || '8081';
const defaultBase = `http://${backendHost}:${backendPort}`;

let rawBackend = process.env.BACKEND_INTERNAL_URL || (publicApi ? publicApi : `${defaultBase}/api/v1`);

if (rawBackend.endsWith('/:path*')) {
  // already formatted
} else if (rawBackend.endsWith('/api/v1') || rawBackend.endsWith('/api/v1/')) {
  rawBackend = rawBackend.replace(/\/+$/, '') + '/:path*';
} else {
  rawBackend = rawBackend.replace(/\/+$/, '') + '/api/v1/:path*';
}

let backendBase = process.env.BACKEND_BASE_URL || (publicApi ? publicApi.replace(/\/api\/v1\/?$/, '') : defaultBase);

// Only if user explicitly passed localhost:8081, normalize to 127.0.0.1 for server-side proxying to prevent Windows Node IPv6 ::1 ECONNREFUSED
if (rawBackend.includes('localhost:8081')) {
  rawBackend = rawBackend.replace('localhost:8081', '127.0.0.1:8081');
}
if (backendBase.includes('localhost:8081')) {
  backendBase = backendBase.replace('localhost:8081', '127.0.0.1:8081');
}

const isStandalone = process.env.NODE_ENV === 'production' && (process.env.NEXT_OUTPUT_STANDALONE === 'true' || process.env.STANDALONE === 'true');

const nextConfig = {
  ...(isStandalone ? { output: 'standalone' } : {}),
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Prevent TypeScript check errors from failing the Docker production build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Prevent ESLint rules from failing the Docker production build
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    const fs = require('fs');
    const localShared = path.resolve(__dirname, 'shared/index.ts');
    const fallbackShared = path.resolve(__dirname, '../shared/dist/index.js');
    const resolvedShared = fs.existsSync(localShared) ? localShared : fallbackShared;

    config.resolve.alias = {
      ...config.resolve.alias,
      '@mederp/shared$': resolvedShared,
      '@mederp/shared': fs.existsSync(localShared) ? path.resolve(__dirname, 'shared') : path.resolve(__dirname, '../shared/dist'),
    };
    return config;
  },
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
