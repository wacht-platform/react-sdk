import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeSessionForAuthToken,
  gateway as backendGateway,
  getAuth as sdkGetAuth,
  getAuthFromToken as sdkGetAuthFromToken,
} from '@wacht/backend';
import {
  appendSetCookie,
  buildCookie,
  readCookie,
  resolveCookieNames,
} from './cookies';
import {
  decorateAuth,
  decorateGatewayAuth,
  setSerializedAuthHeader,
} from './auth-state';
import type { NextWachtAuth, WachtMiddlewareOptions, WachtTokenType } from './middleware';

const AUTH_COOKIE_EXPIRY_BUFFER_SECONDS = 2;

type ExchangedSessionToken = Awaited<ReturnType<typeof exchangeSessionForAuthToken>> & {
  authTokenExpiresAt?: number | null;
};

type TokenExchangeOptions = {
  forwardedFor?: string | null;
};

const exchangeSessionForAuthTokenWithForwarding = exchangeSessionForAuthToken as typeof exchangeSessionForAuthToken &
  ((
    sessionToken: string,
    options: WachtMiddlewareOptions,
    isDevSession: boolean,
    exchangeOptions: TokenExchangeOptions,
  ) => ReturnType<typeof exchangeSessionForAuthToken>);

function authCookieMaxAge(expiresAtMs: number | null): number | undefined {
  if (!expiresAtMs) return undefined;

  const maxAge = Math.floor((expiresAtMs - Date.now()) / 1000) - AUTH_COOKIE_EXPIRY_BUFFER_SECONDS;
  return maxAge > 0 ? maxAge : undefined;
}

function exchangedAuthCookieOptions(exchanged: ExchangedSessionToken): { maxAge?: number } {
  return {
    maxAge: authCookieMaxAge(exchanged.authTokenExpiresAt ?? null),
  };
}

export function tokenExchangeForwardedFor(request: Request | NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwardedFor) return forwardedFor;

  for (const header of ['cf-connecting-ip', 'true-client-ip', 'x-real-ip']) {
    const value = request.headers.get(header)?.trim();
    if (value) return value;
  }

  return null;
}

async function authenticateBearerThroughGateway(
  request: Request | NextRequest,
  token: string,
  options: WachtMiddlewareOptions,
): Promise<NextWachtAuth | null> {
  const method = request.method || 'GET';
  const resource =
    request instanceof NextRequest ? request.nextUrl.pathname : new URL(request.url).pathname;
  const gatewayOptions = options.gatewayUrl ? { gatewayUrl: options.gatewayUrl } : undefined;

  for (const principalType of ['api_key', 'oauth_access_token'] as const) {
    try {
      const authz = await backendGateway.checkPrincipalAuthz(
        {
          principalType,
          principalValue: token,
          method,
          resource,
        },
        gatewayOptions,
      );

      if (!authz.identity) continue;
      const principalContext = backendGateway.resolveGatewayPrincipalContext(authz);
      if (!principalContext) continue;

      return decorateGatewayAuth(request, options, principalContext.tokenType as Extract<WachtTokenType, 'api_key' | 'oauth_token'>, {
        identity: principalContext.identity,
        metadata: principalContext.metadata,
        permissions: principalContext.permissions,
        ownerUserId: principalContext.ownerUserId || undefined,
        organizationId: principalContext.organizationId || undefined,
        workspaceId: principalContext.workspaceId || undefined,
        allowed: authz.allowed,
        reason: authz.reason,
      });
    } catch {
      continue;
    }
  }

  return null;
}

export async function authenticateRequestWithHandshake(
  request: NextRequest,
  options: WachtMiddlewareOptions = {},
): Promise<{
  auth: NextWachtAuth;
  headers: Headers;
}> {
  const headers = new Headers();
  const {
    authCookieName,
    sessionCookieName,
    devSessionCookieName,
    devSessionUpdatedAtCookieName,
  } = resolveCookieNames(options);

  const bearerToken = request.headers.get('authorization')?.startsWith('Bearer ')
    ? request.headers.get('authorization')!.slice(7).trim()
    : null;
  const authCookieToken = readCookie(request, authCookieName);

  for (const token of [bearerToken, authCookieToken]) {
    if (!token) continue;
    const auth = decorateAuth(await sdkGetAuthFromToken(token, options), request, options);
    if (!auth.userId) {
      if (token === bearerToken) {
        const gatewayAuth = await authenticateBearerThroughGateway(request, token, options);
        if (gatewayAuth) {
          setSerializedAuthHeader(headers, gatewayAuth);
          return { auth: gatewayAuth, headers };
        }
      }
      continue;
    }
    setSerializedAuthHeader(headers, auth);
    return { auth, headers };
  }

  const sessionToken = readCookie(request, sessionCookieName);
  const devSessionToken = readCookie(request, devSessionCookieName);
  const isDevSession = !sessionToken && !!devSessionToken;
  const transportToken = sessionToken || devSessionToken;

  if (!transportToken) {
    const auth = decorateAuth(await sdkGetAuth(request, options), request, options);
    setSerializedAuthHeader(headers, auth);
    return { auth, headers };
  }

  const exchanged = await exchangeSessionForAuthTokenWithForwarding(transportToken, options, isDevSession, {
    forwardedFor: tokenExchangeForwardedFor(request),
  });
  const auth = decorateAuth(
    exchanged.authToken
      ? await sdkGetAuthFromToken(exchanged.authToken, options)
      : await sdkGetAuth(request, options),
    request,
    options,
  );

  if (exchanged.authToken && auth.userId) {
    appendSetCookie(
      headers,
      buildCookie(authCookieName, exchanged.authToken, true, exchangedAuthCookieOptions(exchanged)),
    );
  }

  if (exchanged.nextDevSession) {
    appendSetCookie(headers, buildCookie(devSessionCookieName, exchanged.nextDevSession, false));
    appendSetCookie(headers, buildCookie(devSessionUpdatedAtCookieName, String(Date.now()), false));
  }

  if (exchanged.upstreamSessionSetCookie) {
    appendSetCookie(headers, exchanged.upstreamSessionSetCookie);
  }

  if (!auth.userId && !exchanged.authToken) {
    const unauth = decorateAuth(await sdkGetAuth(request, options), request, options);
    setSerializedAuthHeader(headers, unauth);
    return { auth: unauth, headers };
  }

  setSerializedAuthHeader(headers, auth);
  return { auth, headers };
}

export async function normalizeDevSessionQuery(
  request: NextRequest,
  options: WachtMiddlewareOptions = {},
): Promise<NextResponse | null> {
  const devSessionFromQuery = request.nextUrl.searchParams.get('__dev_session__');
  if (!devSessionFromQuery) return null;

  const headers = new Headers();
  const { authCookieName, devSessionCookieName, devSessionUpdatedAtCookieName } =
    resolveCookieNames(options);

  const exchanged = await exchangeSessionForAuthTokenWithForwarding(devSessionFromQuery, options, true, {
    forwardedFor: tokenExchangeForwardedFor(request),
  });
  const auth = exchanged.authToken
    ? decorateAuth(await sdkGetAuthFromToken(exchanged.authToken, options), request, options)
    : null;

  if (auth?.userId && exchanged.authToken) {
    appendSetCookie(
      headers,
      buildCookie(authCookieName, exchanged.authToken, true, exchangedAuthCookieOptions(exchanged)),
    );
    appendSetCookie(
      headers,
      buildCookie(devSessionCookieName, exchanged.nextDevSession || devSessionFromQuery, false),
    );
    appendSetCookie(
      headers,
      buildCookie(devSessionUpdatedAtCookieName, String(Date.now()), false),
    );
  }

  if (exchanged.upstreamSessionSetCookie) {
    appendSetCookie(headers, exchanged.upstreamSessionSetCookie);
  }

  const cleanUrl = request.nextUrl.clone();
  cleanUrl.searchParams.delete('__dev_session__');

  const response = NextResponse.redirect(cleanUrl);
  headers.forEach((value, key) => {
    response.headers.append(key, value);
  });
  return response;
}
