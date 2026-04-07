import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/api/auth/login', '/api/auth/logout', '/api/auth/callback'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return;

  const hasLegacySession = Boolean(req.cookies.get('sn_session')?.value);
  const hasAuth0Session = req.cookies.getAll().some((c) => c.name.startsWith('appSession'));

  if (!hasLegacySession && !hasAuth0Session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signIn = new URL('/sign-in', req.url);
    signIn.searchParams.set('from', pathname);
    return NextResponse.redirect(signIn);
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!x)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
