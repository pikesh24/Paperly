import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Get the token from the cookies
  // Since we used httpOnly cookies in the backend, Next.js can read them here!
  const token = request.cookies.get('token')?.value;

  // 2. Define which paths are public (No login needed)
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/login' || path.startsWith('/_next') || path.startsWith('/static');

  // 3. SCENARIO A: User is NOT logged in and tries to access a protected page
  if (!token && !isPublicPath) {
    // Redirect them to the login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. SCENARIO B: User IS logged in but tries to go back to Login page
  if (token && path === '/login') {
    // Redirect them to the Dashboard (Home)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 5. Allow the request to continue if no issues
  return NextResponse.next();
}

// Configure which paths the middleware runs on (Everything)
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api routes (if any frontend API routes exist)
     * 2. /_next (Next.js internals)
     * 3. /static (static files)
     * 4. /favicon.ico, /sitemap.xml (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};