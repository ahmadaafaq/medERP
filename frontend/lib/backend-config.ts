/**
 * Dynamic resolution of Backend API & Base URLs.
 * Eliminates hardcoded IP/hostnames across Next.js API routes and server components.
 * Priority order:
 * 1. process.env.NEXT_PUBLIC_API_URL (Primary authoritative public/remote API URL from .env)
 * 2. process.env.BACKEND_BASE_URL / process.env.BACKEND_INTERNAL_URL
 * 3. process.env.BACKEND_HOST / BACKEND_PORT
 * 4. Fallback only if no env variables exist: http://100.63.22.73:8081
 */

export function getBackendBaseUrl(): string {
  // 1. Prioritize NEXT_PUBLIC_API_URL configured in .env
  const publicApi = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (publicApi && publicApi !== 'undefined' && publicApi !== 'null' && publicApi.startsWith('http')) {
    let clean = publicApi.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    // If user provided a public IP or domain (e.g. 100.63.22.73), use it directly!
    if (!clean.includes('localhost:8081')) {
      return clean;
    }
    // Only map localhost to 127.0.0.1 if localhost was explicitly entered, to avoid Windows IPv6 ::1 ECONNREFUSED
    return clean.replace('localhost:8081', '127.0.0.1:8081');
  }

  // 2. Next check BACKEND_BASE_URL or BACKEND_INTERNAL_URL
  const envUrl = (process.env.BACKEND_BASE_URL || process.env.BACKEND_INTERNAL_URL)?.trim();
  if (envUrl && envUrl !== 'undefined' && envUrl !== 'null' && envUrl.startsWith('http')) {
    let clean = envUrl.replace(/\/:path\*$/, '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    if (!clean.includes('localhost:8081')) {
      return clean;
    }
    return clean.replace('localhost:8081', '127.0.0.1:8081');
  }

  // 3. Fallback to host/port
  const host = process.env.BACKEND_HOST || '100.63.22.73';
  const port = process.env.BACKEND_PORT || '8081';
  return `http://${host}:${port}`;
}

export function getBackendApiUrl(): string {
  const publicApi = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (publicApi && publicApi !== 'undefined' && publicApi !== 'null' && publicApi.startsWith('http')) {
    let clean = publicApi.replace(/\/$/, '');
    if (!clean.endsWith('/api/v1')) {
      clean = `${clean}/api/v1`;
    }
    if (!clean.includes('localhost:8081')) {
      return clean;
    }
    return clean.replace('localhost:8081', '127.0.0.1:8081');
  }
  return `${getBackendBaseUrl()}/api/v1`;
}

export function getBackendWsUrl(): string {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (wsUrl && wsUrl !== 'undefined' && wsUrl !== 'null' && wsUrl.startsWith('http')) {
    return wsUrl.replace(/\/$/, '');
  }
  return getBackendBaseUrl();
}
