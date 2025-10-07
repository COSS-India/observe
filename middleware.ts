import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/'];

// Routes that require superadmin access (role: 'superadmin')
const superAdminRoutes = [
  '/dashboard/users',
  '/dashboard/organization-users',
  '/dashboard/teams',
  '/dashboard/organizations',
  '/dashboard/folders',
  '/dashboard/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For dashboard routes, check authentication
  if (pathname.startsWith('/dashboard')) {
    // Get auth storage from cookies
    const authStorage = request.cookies.get('auth-storage')?.value;
    
    // If no auth storage, redirect to login (but allow the client to handle it)
    // Don't force redirect here to prevent premature logouts during hydration
    if (!authStorage) {
      console.warn('No auth storage found in cookies for:', pathname);
      // Let the client-side handle the redirect to prevent hydration issues
      return NextResponse.next();
    }

    // Check if route requires superadmin access
    const requiresSuperAdmin = superAdminRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );

    if (requiresSuperAdmin) {
      try {
        const authData = JSON.parse(authStorage);
        const user = authData?.state?.user;
        
        // Only allow access if user has superadmin role
        if (!user || user.role !== 'superadmin') {
          console.log('Non-superadmin user attempted to access:', pathname);
          // Redirect to My Dashboards for non-superadmin users
          return NextResponse.redirect(new URL('/dashboard/my-dashboards', request.url));
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
        // If parsing fails, let client-side handle it
        // Don't force redirect to prevent unnecessary logouts
        return NextResponse.next();
      }
    }
    
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
