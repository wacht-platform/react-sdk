import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeSessionForAuthToken,
  gateway as backendGateway,
  getAuth as sdkGetAuth,
  getAuthFromToken as sdkGetAuthFromToken,
  getAuthFromTokenDetailed as sdkGetAuthFromTokenDetailed,
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
  shouldRefreshRequest: boolean;
  debug: Record<string, string>;
}> {
  const headers = new Headers();
  const {
    authCookieName,
    authRefreshCookieName,
    sessionCookieName,
    devSessionCookieName,
    devSessionUpdatedAtCookieName,
  } = resolveCookieNames(options);
  const debug: Record<string, string> = {};

  const bearerToken = request.headers.get('authorization')?.startsWith('Bearer ')
    ? request.headers.get('authorization')!.slice(7).trim()
    : null;
  const authCookieToken = readCookie(request, authCookieName);
  debug['has_bearer_token'] = bearerToken ? '1' : '0';
  debug['has_auth_cookie'] = authCookieToken ? '1' : '0';

  for (const token of [bearerToken, authCookieToken]) {
    if (!token) continue;
    const auth = decorateAuth(await sdkGetAuthFromToken(token, options), request, options);
    debug['token_source'] = token === bearerToken ? 'bearer' : 'auth_cookie';
    debug['verified_user'] = auth.userId ? '1' : '0';
    if (!auth.userId) {
      if (token === bearerToken) {
        const gatewayAuth = await authenticateBearerThroughGateway(request, token, options);
        if (gatewayAuth) {
          setSerializedAuthHeader(headers, gatewayAuth);
          debug['gateway_fallback'] = '1';
          return { auth: gatewayAuth, headers, shouldRefreshRequest: false, debug };
        }
      }
      continue;
    }
    setSerializedAuthHeader(headers, auth);
    return { auth, headers, shouldRefreshRequest: false, debug };
  }

  const sessionToken = readCookie(request, sessionCookieName);
  const devSessionToken = readCookie(request, devSessionCookieName);
  const isDevSession = !sessionToken && !!devSessionToken;
  const transportToken = sessionToken || devSessionToken;
  debug['has_session_cookie'] = sessionToken ? '1' : '0';
  debug['has_dev_session_cookie'] = devSessionToken ? '1' : '0';
  debug['transport_token_source'] = sessionToken ? 'session' : devSessionToken ? 'dev_session' : 'none';

  if (!transportToken) {
    const auth = decorateAuth(await sdkGetAuth(request, options), request, options);
    setSerializedAuthHeader(headers, auth);
    debug['verified_user'] = auth.userId ? '1' : '0';
    return { auth, headers, shouldRefreshRequest: false, debug };
  }

  const exchanged = await exchangeSessionForAuthToken(transportToken, options, isDevSession);
  debug['exchanged_auth_token'] = exchanged.authToken ? '1' : '0';
  debug['has_upstream_session_set_cookie'] = exchanged.upstreamSessionSetCookie ? '1' : '0';
  debug['has_next_dev_session'] = exchanged.nextDevSession ? '1' : '0';
  const auth = decorateAuth(
    exchanged.authToken
      ? (await sdkGetAuthFromTokenDetailed(exchanged.authToken, options)).auth
      : await sdkGetAuth(request, options),
    request,
    options,
  );
  if (exchanged.authToken) {
    const detailed = await sdkGetAuthFromTokenDetailed(exchanged.authToken, options);
    debug['verify_reason'] = detailed.verifyReason || 'none';
  }
  const refreshAttempted = readCookie(request, authRefreshCookieName) === '1';
  const shouldRefreshRequest =
    !!exchanged.authToken && !!auth.userId && !authCookieToken && !refreshAttempted;
  debug['verified_user'] = auth.userId ? '1' : '0';
  debug['refresh_attempted'] = refreshAttempted ? '1' : '0';
  debug['should_refresh_request'] = shouldRefreshRequest ? '1' : '0';

  if (exchanged.authToken && auth.userId) {
    appendSetCookie(headers, buildCookie(authCookieName, exchanged.authToken, true));
  }

  if (shouldRefreshRequest) {
    appendSetCookie(headers, buildCookie(authRefreshCookieName, '1', false, { maxAge: 15 }));
  } else if (refreshAttempted) {
    appendSetCookie(headers, buildCookie(authRefreshCookieName, '', false, { maxAge: 0 }));
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
    debug['fallback_auth_lookup'] = '1';
    debug['verified_user'] = unauth.userId ? '1' : '0';
    return { auth: unauth, headers, shouldRefreshRequest: false, debug };
  }

  setSerializedAuthHeader(headers, auth);
  return { auth, headers, shouldRefreshRequest, debug };
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

  const exchanged = await exchangeSessionForAuthToken(devSessionFromQuery, options, true);
  const auth = exchanged.authToken
    ? decorateAuth(await sdkGetAuthFromToken(exchanged.authToken, options), request, options)
    : null;

  if (auth?.userId && exchanged.authToken) {
    appendSetCookie(headers, buildCookie(authCookieName, exchanged.authToken, true));
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
