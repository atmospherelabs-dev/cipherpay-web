import 'server-only';

// Server Components need an absolute backend URL. The browser's /api/staging
// proxy is intentionally relative and cannot be used by Node's fetch.
export function serverApiFetch(endpoint: string, init: RequestInit = {}) {
  const staging = process.env.STAGING_MODE === 'true';
  const base = staging
    ? process.env.STAGING_API_URL
    : process.env.CIPHERPAY_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.cipherpay.app';
  if (!base || (staging && !process.env.STAGING_API_KEY)) {
    throw new Error('Server API is not configured');
  }
  const url = new URL(base);
  if (!['https:', 'http:'].includes(url.protocol) || !endpoint.startsWith('/api/')) {
    throw new Error('Invalid server API URL');
  }
  const headers = new Headers(init.headers);
  if (staging) headers.set('X-Staging-Key', process.env.STAGING_API_KEY!);
  const options = { ...init, headers, redirect: 'error' as const };
  if (staging) {
    options.cache = 'no-store';
    delete options.next;
  }
  return fetch(`${base.replace(/\/$/, '')}${endpoint}`, options);
}
