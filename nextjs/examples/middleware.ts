import { wachtMiddleware, createRouteMatcher } from '@snipextt/wacht-nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/pricing',
  '/auth/(.*)',
  '/api/public/(.*)'
]);

// Define routes that require specific organization access
const isOrgRoute = createRouteMatcher(['/org/(.*)']);

// Define admin routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin/(.*)'
]);

export default wachtMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Protect all other routes by default
  try {
    await auth.protect();
  } catch (error) {
    // auth.protect() throws a redirect response when unauthorized
    throw error;
  }

  // Check organization-specific routes
  if (isOrgRoute(request)) {
    const orgId = pathname.split('/')[2];
    
    if (!auth.has({ organizationId: orgId })) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }
  }

  // Admin route protection (role-based - placeholder for future implementation)
  if (isAdminRoute(request)) {
    // TODO: Implement role checking when available
    console.warn('Admin route accessed - role checking not yet implemented');
  }

  // Add custom headers
  const response = NextResponse.next();
  
  if (auth.userId) {
    response.headers.set('X-User-Id', auth.userId);
  }
  
  if (auth.organizationId) {
    response.headers.set('X-Organization-Id', auth.organizationId);
  }

  return response;
}, {
  // Optional configuration
  signInUrl: '/auth/sign-in',
  signUpUrl: '/auth/sign-up',
  debug: process.env.NODE_ENV === 'development'
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};