import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddlewareResult } from 'next/dist/server/web/types';

export interface WachtAuth {
  userId: string | null;
  sessionId: string | null;
  organizationId: string | null;
  workspaceId: string | null;
  organizationPermissions: string[];
  workspacePermissions: string[];
  protect: (options?: ProtectOptions) => Promise<void>;
  has: (permission: PermissionCheck) => boolean;
}

export interface ProtectOptions {
  role?: string | string[];
  permission?: string | string[];
  organizationId?: string;
  workspaceId?: string;
  redirectUrl?: string;
}

export interface PermissionCheck {
  role?: string | string[];
  permission?: string | string[];
  organizationId?: string;
  workspaceId?: string;
}

export interface WachtMiddlewareOptions {
  publicKey?: string;
  apiUrl?: string;
  signInUrl?: string;
  signUpUrl?: string;
  afterSignInUrl?: string;
  afterSignUpUrl?: string;
  debug?: boolean;
  clockSkewInMs?: number;
  jwtTemplate?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  auth: WachtAuth;
}

export interface JWTPayload {
  sub?: string;
  session_id?: string;
  organization?: string;
  organization_permissions?: string[];
  workspace?: string;
  workspace_permissions?: string[];
  exp?: number;
  iat?: number;
  iss?: string;
}

type WachtMiddlewareHandler = (
  auth: WachtAuth,
  request: NextRequest
) => NextMiddlewareResult | Promise<NextMiddlewareResult>;

const SESSION_COOKIE = '__session';
const DEV_SESSION_COOKIE = '__dev_session__';

async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  if (sessionCookie) {
    return sessionCookie.value;
  }

  // In development, check dev session cookie or header
  if (process.env.NODE_ENV === 'development') {
    const devCookie = request.cookies.get(DEV_SESSION_COOKIE);
    if (devCookie) {
      return devCookie.value;
    }

    const devHeader = request.headers.get('x-development-session');
    if (devHeader) {
      return devHeader;
    }
  }

  return null;
}

async function decodeToken(
  token: string,
  options: WachtMiddlewareOptions
): Promise<JWTPayload | null> {
  try {
    // For session tokens from cookies, we need to get the session info
    // For custom JWT tokens from Authorization header, we can decode directly
    
    // First, try to decode the JWT to see what type it is
    const parts = token.split('.');
    if (parts.length !== 3) {
      if (options.debug) {
        console.error('[Wacht Middleware] Invalid JWT format');
      }
      return null;
    }
    
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );
    
    // Check if it's a session token (has sess claim) or custom JWT (has sub claim)
    if (payload.sess) {
      // This is a session token from cookie - we need to get session info
      const apiUrl = options.apiUrl || process.env.NEXT_PUBLIC_WACHT_API_URL || 'https://api.wacht.io';
      
      try {
        const response = await fetch(`${apiUrl}/session/`, {
          headers: {
            'Cookie': `__session=${token}`,
            'X-Wacht-Public-Key': options.publicKey || process.env.NEXT_PUBLIC_WACHT_PUBLIC_KEY || '',
          },
        });

        if (!response.ok) {
          if (options.debug) {
            console.error('[Wacht Middleware] Session fetch failed:', response.status);
          }
          return null;
        }

        const session = await response.json();
        const activeSignin = session.signins?.[0];
        
        if (!activeSignin?.user) {
          return null;
        }

        // Convert session data to JWT payload format
        return {
          sub: activeSignin.user.id,
          session_id: session.id,
          organization: activeSignin.active_organization_id,
          organization_permissions: [], // Would need separate API call to get permissions
          workspace: activeSignin.active_workspace_id,
          workspace_permissions: [], // Would need separate API call to get permissions
          iat: Math.floor(new Date(session.created_at).getTime() / 1000),
          exp: payload.exp,
          iss: payload.iss,
        };
      } catch (error) {
        if (options.debug) {
          console.error('[Wacht Middleware] Error fetching session:', error);
        }
        return null;
      }
    } else if (payload.sub) {
      // This is a custom JWT token - validate expiration
      const now = Math.floor(Date.now() / 1000);
      const clockSkew = (options.clockSkewInMs || 0) / 1000;
      
      if (payload.exp && payload.exp < (now - clockSkew)) {
        if (options.debug) {
          console.error('[Wacht Middleware] Token expired');
        }
        return null;
      }
      
      // Return the decoded payload
      return payload as JWTPayload;
    }
    
    return null;
  } catch (error) {
    if (options.debug) {
      console.error('[Wacht Middleware] Error decoding token:', error);
    }
    return null;
  }
}

function createAuth(
  payload: JWTPayload | null,
  request: NextRequest,
  options: WachtMiddlewareOptions
): WachtAuth {
  return {
    userId: payload?.sub || null,
    sessionId: payload?.session_id || null,
    organizationId: payload?.organization || null,
    workspaceId: payload?.workspace || null,
    organizationPermissions: payload?.organization_permissions || [],
    workspacePermissions: payload?.workspace_permissions || [],
    
    protect: async (protectOptions?: ProtectOptions) => {
      // Check if user is authenticated
      if (!payload?.sub) {
        const signInUrl = options.signInUrl || '/sign-in';
        const redirectUrl = protectOptions?.redirectUrl || signInUrl;
        
        throw new Response('Unauthorized', {
          status: 302,
          headers: {
            Location: `${redirectUrl}?redirect_url=${encodeURIComponent(request.url)}`,
          },
        });
      }

      // Check organization access
      if (protectOptions?.organizationId && 
          payload.organization !== protectOptions.organizationId) {
        throw new Response('Forbidden', { status: 403 });
      }

      // Check workspace access
      if (protectOptions?.workspaceId && 
          payload.workspace !== protectOptions.workspaceId) {
        throw new Response('Forbidden', { status: 403 });
      }

      // Check permissions
      if (protectOptions?.permission) {
        const requiredPermissions = Array.isArray(protectOptions.permission) 
          ? protectOptions.permission 
          : [protectOptions.permission];
        
        const hasPermission = requiredPermissions.some(permission => {
          if (payload.organization && payload.organization_permissions?.includes(permission)) {
            return true;
          }
          if (payload.workspace && payload.workspace_permissions?.includes(permission)) {
            return true;
          }
          return false;
        });

        if (!hasPermission) {
          throw new Response('Forbidden', { status: 403 });
        }
      }
    },

    has: (check: PermissionCheck) => {
      if (!payload?.sub) return false;

      // Check organization
      if (check.organizationId && payload.organization !== check.organizationId) {
        return false;
      }

      // Check workspace
      if (check.workspaceId && payload.workspace !== check.workspaceId) {
        return false;
      }

      // Check permissions
      if (check.permission) {
        const requiredPermissions = Array.isArray(check.permission) 
          ? check.permission 
          : [check.permission];
        
        return requiredPermissions.some(permission => {
          if (payload.organization && payload.organization_permissions?.includes(permission)) {
            return true;
          }
          if (payload.workspace && payload.workspace_permissions?.includes(permission)) {
            return true;
          }
          return false;
        });
      }

      return true;
    },
  };
}

export function wachtMiddleware(
  handler?: WachtMiddlewareHandler,
  options: WachtMiddlewareOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      // Get token from request
      const token = await getTokenFromRequest(request);
      
      // Decode/verify token
      const payload = token ? await decodeToken(token, options) : null;
      
      // Create auth object
      const auth = createAuth(payload, request, options);

      // If no handler provided, just attach auth to request
      if (!handler) {
        const response = NextResponse.next();
        
        // Add auth data to headers for server components
        if (payload) {
          response.headers.set('x-wacht-auth', JSON.stringify({
            userId: auth.userId,
            sessionId: auth.sessionId,
            organizationId: auth.organizationId,
            workspaceId: auth.workspaceId,
            organizationPermissions: auth.organizationPermissions,
            workspacePermissions: auth.workspacePermissions,
          }));
        }
        
        return response;
      }

      // Call the handler
      try {
        const result = await handler(auth, request);
        
        // Handle thrown responses (from auth.protect())
        if (result instanceof Response) {
          return NextResponse.redirect(
            new URL(
              result.headers.get('Location') || '/',
              request.url
            ),
            result.status as 301 | 302 | 303 | 307 | 308
          );
        }
        
        return result || NextResponse.next();
      } catch (error) {
        // Handle protection errors
        if (error instanceof Response) {
          if (error.status === 302) {
            return NextResponse.redirect(
              new URL(
                error.headers.get('Location') || options.signInUrl || '/sign-in',
                request.url
              )
            );
          }
          return new NextResponse(error.body, {
            status: error.status,
            headers: error.headers,
          });
        }
        
        throw error;
      }
    } catch (error) {
      if (options.debug) {
        console.error('[Wacht Middleware] Error:', error);
      }
      
      return NextResponse.next();
    }
  };
}

// Route matcher utility
export function createRouteMatcher(
  patterns: string[]
): (req: NextRequest) => boolean {
  const matchers = patterns.map(pattern => {
    // Convert route pattern to regex
    const regex = pattern
      .replace(/\//g, '\\/')
      .replace(/\*/g, '[^/]*')
      .replace(/\(\.\*\)/g, '.*')
      .replace(/\(([^)]+)\)/g, '(?:$1)');
    
    return new RegExp(`^${regex}$`);
  });

  return (req: NextRequest) => {
    const pathname = req.nextUrl.pathname;
    return matchers.some(matcher => matcher.test(pathname));
  };
}

// Helper to get auth from headers in server components
export function auth(headers: Headers): WachtAuth {
  const authHeader = headers.get('x-wacht-auth');
  
  if (!authHeader) {
    return {
      userId: null,
      sessionId: null,
      organizationId: null,
      workspaceId: null,
      organizationPermissions: [],
      workspacePermissions: [],
      protect: async () => {
        throw new Error('Cannot use protect() in server components. Use middleware instead.');
      },
      has: () => false,
    };
  }

  const authData = JSON.parse(authHeader);
  
  return {
    ...authData,
    protect: async () => {
      throw new Error('Cannot use protect() in server components. Use middleware instead.');
    },
    has: (check: PermissionCheck) => {
      // Check organization
      if (check.organizationId && authData.organizationId !== check.organizationId) {
        return false;
      }
      
      // Check workspace
      if (check.workspaceId && authData.workspaceId !== check.workspaceId) {
        return false;
      }
      
      // Check permissions
      if (check.permission) {
        const requiredPermissions = Array.isArray(check.permission) 
          ? check.permission 
          : [check.permission];
        
        return requiredPermissions.some(permission => {
          if (authData.organizationId && authData.organizationPermissions?.includes(permission)) {
            return true;
          }
          if (authData.workspaceId && authData.workspacePermissions?.includes(permission)) {
            return true;
          }
          return false;
        });
      }
      
      return true;
    },
  };
}