import {
  WachtAuthError,
  type PermissionCheck,
  type ResolvedAuthzIdentity,
  type SessionPrincipalIdentity,
  type SessionPrincipalMetadata,
  type WachtAuth,
  toSessionPrincipalIdentity,
  toSessionPrincipalMetadata,
} from '@wacht/backend';
import type { NextRequest } from 'next/server';
import { AUTH_HEADER, getFrontendApiUrl } from './cookies';
import { deriveAccountPortalSignInBaseUrl, resolvePublicRequestUrl } from './urls';
import type {
  NextProtectOptions,
  NextWachtAuth,
  RedirectToSignInOptions,
  WachtAcceptedTokenType,
  WachtMiddlewareOptions,
  WachtPrincipalIdentity,
  WachtTokenType,
} from './middleware';

export type SerializedNextAuth = {
  userId: string | null;
  sessionId: string | null;
  organizationId: string | null;
  workspaceId: string | null;
  organizationPermissions: string[];
  workspacePermissions: string[];
  tokenType: WachtTokenType | null;
  ownerUserId: string | null;
  identity: WachtPrincipalIdentity | null;
  metadata: SessionPrincipalMetadata | Record<string, unknown> | null;
};

export function createRedirectToSignIn(
  request: Request | NextRequest,
  options: WachtMiddlewareOptions,
): (params?: RedirectToSignInOptions) => never {
  return (params?: RedirectToSignInOptions) => {
    const publicRequestUrl = resolvePublicRequestUrl(request);
    const returnBackUrl = params?.returnBackUrl
      ? new URL(String(params.returnBackUrl), publicRequestUrl).toString()
      : publicRequestUrl;
    const base =
      options.signInUrl || deriveAccountPortalSignInBaseUrl(getFrontendApiUrl(options));
    const separator = base.includes('?') ? '&' : '?';
    const redirectUrl = `${base}${separator}redirect_uri=${encodeURIComponent(returnBackUrl)}`;

    throw new WachtAuthError('unauthenticated', 401, 'Authentication required', {
      redirectUrl,
    });
  };
}

function normalizeAcceptedTokenTypes(
  token?: WachtAcceptedTokenType,
): WachtTokenType[] | 'any' {
  if (!token) return ['session_token'];
  if (token === 'any') return 'any';
  return Array.isArray(token) ? token : [token];
}

function ensureAcceptedTokenType(
  currentTokenType: WachtTokenType | null,
  requested?: WachtAcceptedTokenType,
): void {
  const accepted = normalizeAcceptedTokenTypes(requested);
  if (accepted === 'any') return;
  if (!currentTokenType || !accepted.includes(currentTokenType)) {
    throw new WachtAuthError('unauthenticated', 401, 'Authentication required');
  }
}

export function decorateAuth(
  auth: WachtAuth,
  request: Request | NextRequest,
  options: WachtMiddlewareOptions = {},
): NextWachtAuth {
  const redirectToSignIn = createRedirectToSignIn(request, options);
  const tokenType: WachtTokenType | null = auth.userId ? 'session_token' : null;
  const identity = toSessionPrincipalIdentity(auth);
  const metadata = toSessionPrincipalMetadata(auth);

  return {
    ...auth,
    isAuthenticated: !!auth.userId,
    tokenType,
    ownerUserId: null,
    identity,
    metadata,
    redirectToSignIn,
    async protect(protectOptions?: NextProtectOptions) {
      ensureAcceptedTokenType(tokenType, protectOptions?.token);

      try {
        await auth.protect(protectOptions);
      } catch (error) {
        if (!(error instanceof WachtAuthError)) {
          throw error;
        }

        if (error.code === 'unauthenticated' && protectOptions?.unauthenticatedUrl) {
          throw new WachtAuthError(error.code, error.status, error.message, {
            redirectUrl: protectOptions.unauthenticatedUrl,
          });
        }

        if (error.code === 'forbidden' && protectOptions?.unauthorizedUrl) {
          throw new WachtAuthError(error.code, error.status, error.message, {
            redirectUrl: protectOptions.unauthorizedUrl,
          });
        }

        throw error;
      }
    },
  };
}

export function decorateGatewayAuth(
  request: Request | NextRequest,
  options: WachtMiddlewareOptions,
  tokenType: Extract<WachtTokenType, 'api_key' | 'oauth_token'>,
  authz: {
    identity: ResolvedAuthzIdentity;
    metadata: SessionPrincipalMetadata | Record<string, unknown> | null;
    permissions: string[];
    organizationId?: string;
    workspaceId?: string;
    ownerUserId?: string;
    allowed?: boolean;
    reason?: string;
  },
): NextWachtAuth {
  const permissions = authz.permissions || [];
  const organizationPermissions = [...permissions];
  const workspacePermissions = [...permissions];
  const organizationId = authz.organizationId || null;
  const workspaceId = authz.workspaceId || null;
  const redirectToSignIn = createRedirectToSignIn(request, options);

  const has = (check: PermissionCheck): boolean => {
    if (check.organizationId && check.organizationId !== organizationId) return false;
    if (check.workspaceId && check.workspaceId !== workspaceId) return false;
    if (!check.permission) return true;
    const required = Array.isArray(check.permission) ? check.permission : [check.permission];
    return required.some((perm) => permissions.includes(perm));
  };

  return {
    userId: null,
    sessionId: null,
    organizationId,
    workspaceId,
    organizationPermissions,
    workspacePermissions,
    isAuthenticated: true,
    tokenType,
    ownerUserId: authz.ownerUserId || null,
    identity: authz.identity,
    metadata: authz.metadata,
    has,
    redirectToSignIn,
    async protect(protectOptions?: NextProtectOptions) {
      ensureAcceptedTokenType(tokenType, protectOptions?.token);

      if (authz.allowed === false) {
        if (authz.reason === 'rate_limited') {
          throw new WachtAuthError('forbidden', 429, 'Rate limited');
        }
        throw new WachtAuthError('forbidden', 403, 'Forbidden');
      }

      const allowed = has(protectOptions || {});
      if (!allowed) {
        const baseError = new WachtAuthError('forbidden', 403, 'Forbidden');
        if (protectOptions?.unauthorizedUrl) {
          throw new WachtAuthError('forbidden', 403, 'Forbidden', {
            redirectUrl: protectOptions.unauthorizedUrl,
          });
        }
        throw baseError;
      }
    },
  };
}

export function setSerializedAuthHeader(headers: Headers, auth: NextWachtAuth): void {
  headers.set(
    AUTH_HEADER,
    JSON.stringify({
      userId: auth.userId,
      sessionId: auth.sessionId,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      organizationPermissions: auth.organizationPermissions,
      workspacePermissions: auth.workspacePermissions,
      tokenType: auth.tokenType,
      ownerUserId: auth.ownerUserId,
      identity: auth.identity,
      metadata: auth.metadata,
    }),
  );
}

export function parseSerializedNextAuth(headers: Headers): SerializedNextAuth {
  const serialized = headers.get(AUTH_HEADER);
  if (!serialized) {
    throw new Error('Missing x-wacht-auth header.');
  }
  return JSON.parse(serialized) as SerializedNextAuth;
}

export function authFromSerializedHeader(parsed: SerializedNextAuth): NextWachtAuth {
  const isAuthenticated = parsed.tokenType !== null;

  const has = (check: PermissionCheck): boolean => {
    if (!isAuthenticated) return false;
    if (check.organizationId && check.organizationId !== parsed.organizationId) {
      return false;
    }
    if (check.workspaceId && check.workspaceId !== parsed.workspaceId) {
      return false;
    }
    if (!check.permission) return true;
    const required = Array.isArray(check.permission) ? check.permission : [check.permission];
    const permissions =
      parsed.workspacePermissions.length > 0
        ? parsed.workspacePermissions
        : parsed.organizationPermissions;
    return required.some((perm) => permissions.includes(perm));
  };

  return {
    userId: parsed.userId,
    sessionId: parsed.sessionId,
    organizationId: parsed.organizationId,
    workspaceId: parsed.workspaceId,
    organizationPermissions: parsed.organizationPermissions,
    workspacePermissions: parsed.workspacePermissions,
    isAuthenticated,
    tokenType: parsed.tokenType,
    ownerUserId: parsed.ownerUserId,
    identity: parsed.identity as SessionPrincipalIdentity | ResolvedAuthzIdentity | null,
    metadata: parsed.metadata,
    has,
    async protect(protectOptions?: NextProtectOptions) {
      ensureAcceptedTokenType(parsed.tokenType, protectOptions?.token);

      if (!isAuthenticated) {
        throw new WachtAuthError('unauthenticated', 401, 'Authentication required');
      }

      if (!has(protectOptions || {})) {
        if (protectOptions?.unauthorizedUrl) {
          throw new WachtAuthError('forbidden', 403, 'Forbidden', {
            redirectUrl: protectOptions.unauthorizedUrl,
          });
        }
        throw new WachtAuthError('forbidden', 403, 'Forbidden');
      }
    },
    redirectToSignIn: () => {
      throw new Error(
        'redirectToSignIn() requires request context. Use getAuth(request) or auth(request).',
      );
    },
  };
}
