import type { NextRequest } from 'next/server';

export const STAGING_COOKIE = '__Host-cipherpay-staging';

async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

// A random staging password is required; a secure cookie allows dashboard API
// requests to retain their own Authorization header after the browser login.
export async function stagingAccess(request: NextRequest) {
  const password = process.env.STAGING_PASSWORD;
  if (!password || password.length < 24) return { configured: false, authorized: false, session: '' };
  const credentials = `cipherpay:${password}`;
  const session = await digest(`cipherpay-staging:${credentials}`);
  if (equal(request.cookies.get(STAGING_COOKIE)?.value || '', session)) {
    return { configured: true, authorized: true, session };
  }
  const header = request.headers.get('authorization') || '';
  let supplied = '';
  try { if (header.startsWith('Basic ')) supplied = atob(header.slice(6)); } catch { /* invalid credentials */ }
  return { configured: true, authorized: equal(await digest(`cipherpay-staging:${supplied}`), session), session };
}
