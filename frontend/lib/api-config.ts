/**
 * Global API and WebSocket URL configuration
 * Falls back to relative '/api/v1' so that Next.js rewrites proxy seamlessly to backend.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}` : '');

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function getWsBaseUrl(): string {
  return WS_BASE;
}
