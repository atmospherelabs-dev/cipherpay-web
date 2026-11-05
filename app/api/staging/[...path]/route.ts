import { NextRequest, NextResponse } from 'next/server';
import { stagingAccess } from '@/lib/staging-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (process.env.STAGING_MODE !== 'true') return new NextResponse(null, { status: 404 });
  if (!(await stagingAccess(request)).authorized) return new NextResponse(null, { status: 401 });
  const origin = request.headers.get('origin');
  if (!['GET', 'HEAD'].includes(request.method) && origin && origin !== request.nextUrl.origin) {
    return new NextResponse(null, { status: 403 });
  }
  const upstream = process.env.STAGING_API_URL;
  const secret = process.env.STAGING_API_KEY;
  if (!upstream || !secret) return new NextResponse(null, { status: 503 });
  const { path } = await context.params;
  if (path[0] !== 'api' || path.some(segment => segment === '.' || segment === '..' || segment.includes('/'))) {
    return new NextResponse(null, { status: 400 });
  }
  const headers = new Headers({ 'X-Staging-Key': secret });
  for (const name of ['x-checkout-token', 'content-type', 'x-api-key']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const cookies = request.cookies.getAll().filter(cookie => cookie.name !== '__Host-cipherpay-staging');
  if (cookies.length) headers.set('cookie', cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '));
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) headers.set('authorization', authorization);
  try {
    const url = `${upstream.replace(/\/$/, '')}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
    const response = await fetch(url, {
      method: request.method, headers, redirect: 'error', cache: 'no-store',
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      signal: AbortSignal.timeout(55000),
    });
    const output = new Headers({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });
    output.set('Content-Type', response.headers.get('content-type') || 'application/json');
    for (const cookie of response.headers.getSetCookie()) output.append('Set-Cookie', cookie);
    return new Response(response.body, { status: response.status, headers: output });
  } catch {
    return NextResponse.json({ error: 'Staging API temporarily unavailable' }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
