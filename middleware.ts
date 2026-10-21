import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { stagingAccess, STAGING_COOKIE } from './lib/staging-auth';

const localize = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const staging = process.env.STAGING_MODE === 'true';
  const access = staging ? await stagingAccess(request) : null;
  if (access && !access.authorized) {
    return new NextResponse(access.configured ? 'Private CipherPay staging' : 'Staging access is not configured', {
      status: access.configured ? 401 : 503,
      headers: { 'WWW-Authenticate': 'Basic realm="CipherPay staging"', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }
  const path = request.nextUrl.pathname;
  const response = path.startsWith('/api/') || path.startsWith('/_vercel/') || path.includes('.')
    ? NextResponse.next() : localize(request);
  if (access) {
    response.cookies.set(STAGING_COOKIE, access.session, { secure: true, httpOnly: true, sameSite: 'strict', path: '/', maxAge: 86400 });
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
