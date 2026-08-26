import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for Route Protection
 * Prevents direct link access to any dashboard route without valid login authentication.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define Public routes that do NOT require authentication
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/access/owner' ||
    pathname === '/access/superadmin' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/uploads/') ||
    pathname.includes('favicon.ico');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 2. Check Authentication Cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const authRole = request.cookies.get('auth_role')?.value;

  // 3. If accessing dashboard routes without token -> REDIRECT TO LOGIN
  if (pathname.startsWith('/dashboard')) {
    if (!authToken) {
      // If user attempted to access owner/superadmin dashboard, redirect to superadmin portal
      if (pathname.startsWith('/dashboard/owner') || pathname.startsWith('/dashboard/superadmin')) {
        const superadminLoginUrl = new URL('/access/superadmin', request.url);
        superadminLoginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(superadminLoginUrl);
      }

      // For all standard college dashboards (admin, faculty, student, clerk, warden) -> redirect to /login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and assets
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
