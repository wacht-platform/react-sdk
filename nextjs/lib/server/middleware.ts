import { NextRequest, NextResponse } from "next/server";
import type { NextMiddlewareResult } from "next/dist/server/web/types";
import {
    gateway as backendGateway,
    getAuth as sdkGetAuth,
    getAuthFromToken as sdkGetAuthFromToken,
    parseFrontendApiUrlFromPublishableKey,
    toSessionPrincipalIdentity,
    toSessionPrincipalMetadata,
    WachtAuthError,
    type ResolvedAuthzIdentity,
    type JWTPayload,
    type PermissionCheck,
    type ProtectOptions,
    type SessionPrincipalIdentity,
    type SessionPrincipalMetadata,
    type WachtAuth,
    type WachtServerOptions,
} from "@wacht/backend";

export type { WachtAuth, ProtectOptions, PermissionCheck, JWTPayload };
export type { SessionPrincipalIdentity, SessionPrincipalMetadata } from "@wacht/backend";

export interface RedirectToSignInOptions {
    returnBackUrl?: string | URL;
}

export type WachtTokenType =
    | "session_token"
    | "oauth_token"
    | "machine_token"
    | "api_key";

export type WachtAcceptedTokenType =
    | WachtTokenType
    | "any"
    | WachtTokenType[];

export type WachtPrincipalIdentity =
    | SessionPrincipalIdentity
    | ResolvedAuthzIdentity;

export interface NextProtectOptions extends ProtectOptions {
    unauthenticatedUrl?: string;
    unauthorizedUrl?: string;
    token?: WachtAcceptedTokenType;
}

export interface NextWachtAuth extends Omit<WachtAuth, "protect"> {
    isAuthenticated: boolean;
    tokenType: WachtTokenType | null;
    ownerUserId: string | null;
    identity: WachtPrincipalIdentity | null;
    metadata: SessionPrincipalMetadata | Record<string, unknown> | null;
    protect: (options?: NextProtectOptions) => Promise<void>;
    redirectToSignIn: (options?: RedirectToSignInOptions) => never;
}

export interface WachtMiddlewareOptions extends WachtServerOptions {
    apiRoutePrefixes?: string[];
    isApiRoute?: (request: NextRequest) => boolean;
    gatewayUrl?: string;
}

export interface AuthenticatedRequest extends NextRequest {
    auth: NextWachtAuth;
}

type WachtMiddlewareHandler = (
    authState: NextWachtAuth,
    request: NextRequest,
) => NextMiddlewareResult | Promise<NextMiddlewareResult>;

const AUTH_HEADER = "x-wacht-auth";
const DEFAULT_SESSION_COOKIE = "__session";
const DEFAULT_DEV_SESSION_COOKIE = "__dev_session__";
const DEFAULT_DEV_SESSION_UPDATED_AT_COOKIE = "__dev_session_updated_at";
const DEFAULT_AUTH_COOKIE = "__auth";
const DEV_SESSION_HEADER = "x-development-session";

function isApiLikeRequest(
    request: NextRequest,
    options: WachtMiddlewareOptions,
): boolean {
    if (options.isApiRoute) {
        return options.isApiRoute(request);
    }

    if (!options.apiRoutePrefixes) {
        return false;
    }

    const pathname = request.nextUrl.pathname;
    return options.apiRoutePrefixes.some((prefix) =>
        pathname.startsWith(prefix),
    );
}

function applyAuthHeaders(response: NextResponse, headers: Headers): void {
    headers.forEach((value, key) => {
        response.headers.append(key, value);
    });
}

function readCookie(request: Request, cookieName: string): string | null {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;

    for (const part of cookieHeader.split(";")) {
        const [name, ...rest] = part.trim().split("=");
        if (name !== cookieName) continue;
        return decodeURIComponent(rest.join("="));
    }

    return null;
}

function appendSetCookie(headers: Headers, value: string): void {
    headers.append("Set-Cookie", value);
}

function buildCookie(name: string, value: string, httpOnly: boolean): string {
    const encoded = encodeURIComponent(value);
    return `${name}=${encoded}; Path=/; Secure; SameSite=Lax${httpOnly ? "; HttpOnly" : ""}`;
}

function getFrontendApiUrl(options: WachtMiddlewareOptions): string {
    const parsed = parseFrontendApiUrlFromPublishableKey(
        options.publishableKey ||
            process.env.NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY ||
            process.env.WACHT_PUBLISHABLE_KEY,
    );

    if (!parsed) {
        throw new Error(
            "Unable to derive frontend API URL from publishable key. Set NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY.",
        );
    }

    return parsed;
}

function deriveAccountPortalSignInBaseUrl(frontendApiUrl: string): string {
    const frontend = new URL(frontendApiUrl);
    const labels = frontend.hostname.split(".");

    if (labels.length < 3) {
        return `${frontend.origin.replace(/\/$/, "")}/sign-in`;
    }

    const portalLabels = [...labels];
    if (portalLabels[1] === "fapi") {
        portalLabels[1] = "accounts";
    } else {
        portalLabels.splice(1, 0, "accounts");
    }

    return `${frontend.protocol}//${portalLabels.join(".")}/sign-in`;
}

function resolveSignInRedirectUrl(
    request: NextRequest,
    options: WachtMiddlewareOptions,
    explicitRedirectUrl?: string,
): string {
    const base =
        explicitRedirectUrl ||
        options.signInUrl ||
        deriveAccountPortalSignInBaseUrl(getFrontendApiUrl(options));
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}redirect_uri=${encodeURIComponent(request.url)}`;
}

function createRedirectToSignIn(
    request: Request | NextRequest,
    options: WachtMiddlewareOptions,
): (params?: RedirectToSignInOptions) => never {
    return (params?: RedirectToSignInOptions) => {
        const returnBackUrl = params?.returnBackUrl
            ? new URL(String(params.returnBackUrl), request.url).toString()
            : request.url;
        const base =
            options.signInUrl ||
            deriveAccountPortalSignInBaseUrl(getFrontendApiUrl(options));
        const separator = base.includes("?") ? "&" : "?";
        const redirectUrl = `${base}${separator}redirect_uri=${encodeURIComponent(
            returnBackUrl,
        )}`;

        throw new WachtAuthError(
            "unauthenticated",
            401,
            "Authentication required",
            { redirectUrl },
        );
    };
}

function normalizeAcceptedTokenTypes(
    token?: WachtAcceptedTokenType,
): WachtTokenType[] | "any" {
    if (!token) return ["session_token"];
    if (token === "any") return "any";
    return Array.isArray(token) ? token : [token];
}

function ensureAcceptedTokenType(
    currentTokenType: WachtTokenType | null,
    requested?: WachtAcceptedTokenType,
): void {
    const accepted = normalizeAcceptedTokenTypes(requested);
    if (accepted === "any") return;
    if (!currentTokenType || !accepted.includes(currentTokenType)) {
        throw new WachtAuthError(
            "unauthenticated",
            401,
            "Authentication required",
        );
    }
}

function decorateAuth(
    auth: WachtAuth,
    request: Request | NextRequest,
    options: WachtMiddlewareOptions = {},
): NextWachtAuth {
    const redirectToSignIn = createRedirectToSignIn(request, options);
    const tokenType: WachtTokenType | null = auth.userId ? "session_token" : null;
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

                if (
                    error.code === "unauthenticated" &&
                    protectOptions?.unauthenticatedUrl
                ) {
                    throw new WachtAuthError(
                        error.code,
                        error.status,
                        error.message,
                        { redirectUrl: protectOptions.unauthenticatedUrl },
                    );
                }

                if (
                    error.code === "forbidden" &&
                    protectOptions?.unauthorizedUrl
                ) {
                    throw new WachtAuthError(
                        error.code,
                        error.status,
                        error.message,
                        { redirectUrl: protectOptions.unauthorizedUrl },
                    );
                }

                throw error;
            }
        },
    };
}

function decorateGatewayAuth(
    request: Request | NextRequest,
    options: WachtMiddlewareOptions,
    tokenType: Extract<WachtTokenType, "api_key" | "oauth_token">,
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
        if (check.organizationId && check.organizationId !== organizationId)
            return false;
        if (check.workspaceId && check.workspaceId !== workspaceId) return false;
        if (!check.permission) return true;
        const required = Array.isArray(check.permission)
            ? check.permission
            : [check.permission];
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
                if (authz.reason === "rate_limited") {
                    throw new WachtAuthError(
                        "forbidden",
                        429,
                        "Rate limited",
                    );
                }
                throw new WachtAuthError(
                    "forbidden",
                    403,
                    "Forbidden",
                );
            }

            const allowed = has(protectOptions || {});
            if (!allowed) {
                const baseError = new WachtAuthError(
                    "forbidden",
                    403,
                    "Forbidden",
                );
                if (protectOptions?.unauthorizedUrl) {
                    throw new WachtAuthError("forbidden", 403, "Forbidden", {
                        redirectUrl: protectOptions.unauthorizedUrl,
                    });
                }
                throw baseError;
            }
        },
    };
}

async function authenticateBearerThroughGateway(
    request: Request | NextRequest,
    token: string,
    options: WachtMiddlewareOptions,
): Promise<NextWachtAuth | null> {
    const method = request.method || "GET";
    const resource =
        request instanceof NextRequest
            ? request.nextUrl.pathname
            : new URL(request.url).pathname;
    const gatewayOptions = options.gatewayUrl
        ? { gatewayUrl: options.gatewayUrl }
        : undefined;

    for (const principalType of ["api_key", "oauth_access_token"] as const) {
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
            const principalContext =
                backendGateway.resolveGatewayPrincipalContext(authz);
            if (!principalContext) continue;

            return decorateGatewayAuth(
                request,
                options,
                principalContext.tokenType,
                {
                    identity: principalContext.identity,
                    metadata: principalContext.metadata,
                    permissions: principalContext.permissions,
                    ownerUserId: principalContext.ownerUserId || undefined,
                    organizationId: principalContext.organizationId || undefined,
                    workspaceId: principalContext.workspaceId || undefined,
                    allowed: authz.allowed,
                    reason: authz.reason,
                },
            );
        } catch {
            continue;
        }
    }

    return null;
}

async function exchangeSessionForAuthToken(
    options: WachtMiddlewareOptions,
    sessionToken: string,
    isDevSession: boolean,
): Promise<{
    authToken: string | null;
    nextDevSession: string | null;
    upstreamSessionSetCookie: string | null;
}> {
    const frontendApiUrl = getFrontendApiUrl(options);
    const endpoint = new URL(`${frontendApiUrl}/session/token`);
    const headers = new Headers({ Accept: "application/json" });

    if (isDevSession) {
        endpoint.searchParams.set("__dev_session__", sessionToken);
    } else {
        const sessionCookieName =
            options.sessionCookieName || DEFAULT_SESSION_COOKIE;
        headers.set(
            "Cookie",
            `${sessionCookieName}=${encodeURIComponent(sessionToken)}`,
        );
    }

    const response = await fetch(endpoint.toString(), {
        method: "GET",
        headers,
        credentials: "omit",
    });

    if (!response.ok) {
        return {
            authToken: null,
            nextDevSession: null,
            upstreamSessionSetCookie: response.headers.get("set-cookie"),
        };
    }

    const json = (await response.json()) as { data?: { token?: string } };
    return {
        authToken: json?.data?.token || null,
        nextDevSession: response.headers.get(DEV_SESSION_HEADER),
        upstreamSessionSetCookie: response.headers.get("set-cookie"),
    };
}

function setSerializedAuthHeader(headers: Headers, auth: NextWachtAuth): void {
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

type SerializedNextAuth = {
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

function parseSerializedNextAuth(headers: Headers): SerializedNextAuth {
    const serialized = headers.get(AUTH_HEADER);
    if (!serialized) {
        throw new Error("Missing x-wacht-auth header.");
    }
    return JSON.parse(serialized) as SerializedNextAuth;
}

function authFromSerializedHeader(parsed: SerializedNextAuth): NextWachtAuth {
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
        const required = Array.isArray(check.permission)
            ? check.permission
            : [check.permission];
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
        identity: parsed.identity,
        metadata: parsed.metadata,
        has,
        async protect(protectOptions?: NextProtectOptions) {
            ensureAcceptedTokenType(parsed.tokenType, protectOptions?.token);

            if (!isAuthenticated) {
                throw new WachtAuthError("unauthenticated", 401, "Authentication required");
            }

            if (!has(protectOptions || {})) {
                if (protectOptions?.unauthorizedUrl) {
                    throw new WachtAuthError("forbidden", 403, "Forbidden", {
                        redirectUrl: protectOptions.unauthorizedUrl,
                    });
                }
                throw new WachtAuthError("forbidden", 403, "Forbidden");
            }
        },
        redirectToSignIn: () => {
            throw new Error(
                "redirectToSignIn() requires request context. Use getAuth(request) or auth(request).",
            );
        },
    };
}

async function authenticateRequestWithHandshake(
    request: NextRequest,
    options: WachtMiddlewareOptions = {},
): Promise<{ auth: NextWachtAuth; headers: Headers }> {
    const headers = new Headers();
    const authCookieName = options.authCookieName || DEFAULT_AUTH_COOKIE;
    const sessionCookieName =
        options.sessionCookieName || DEFAULT_SESSION_COOKIE;
    const devSessionCookieName =
        options.devSessionCookieName || DEFAULT_DEV_SESSION_COOKIE;
    const devSessionUpdatedAtCookieName = DEFAULT_DEV_SESSION_UPDATED_AT_COOKIE;

    const bearerToken = request.headers
        .get("authorization")
        ?.startsWith("Bearer ")
        ? request.headers.get("authorization")!.slice(7).trim()
        : null;
    const authCookieToken = readCookie(request, authCookieName);

    for (const token of [bearerToken, authCookieToken]) {
        if (!token) continue;
        const auth = decorateAuth(
            await sdkGetAuthFromToken(token, options),
            request,
            options,
        );
        if (!auth.userId) {
            if (token === bearerToken) {
                const gatewayAuth = await authenticateBearerThroughGateway(
                    request,
                    token,
                    options,
                );
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

    const exchanged = await exchangeSessionForAuthToken(
        options,
        transportToken,
        isDevSession,
    );

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
            buildCookie(authCookieName, exchanged.authToken, true),
        );
    }

    if (exchanged.nextDevSession) {
        appendSetCookie(
            headers,
            buildCookie(devSessionCookieName, exchanged.nextDevSession, false),
        );
        appendSetCookie(
            headers,
            buildCookie(
                devSessionUpdatedAtCookieName,
                String(Date.now()),
                false,
            ),
        );
    }

    if (exchanged.upstreamSessionSetCookie) {
        appendSetCookie(headers, exchanged.upstreamSessionSetCookie);
    }

    if (!auth.userId && !exchanged.authToken) {
        // ensure redirect-capable auth object includes request context
        const unauth = decorateAuth(
            await sdkGetAuth(request, options),
            request,
            options,
        );
        setSerializedAuthHeader(headers, unauth);
        return { auth: unauth, headers };
    }

    setSerializedAuthHeader(headers, auth);
    return { auth, headers };
}

async function normalizeDevSessionQuery(
    request: NextRequest,
    options: WachtMiddlewareOptions = {},
): Promise<NextResponse | null> {
    const devSessionFromQuery =
        request.nextUrl.searchParams.get("__dev_session__");
    if (!devSessionFromQuery) return null;

    const headers = new Headers();
    const authCookieName = options.authCookieName || DEFAULT_AUTH_COOKIE;
    const devSessionCookieName =
        options.devSessionCookieName || DEFAULT_DEV_SESSION_COOKIE;

    const exchanged = await exchangeSessionForAuthToken(
        options,
        devSessionFromQuery,
        true,
    );
    const auth = exchanged.authToken
        ? decorateAuth(
              await sdkGetAuthFromToken(exchanged.authToken, options),
              request,
              options,
          )
        : null;

    // Only persist local dev-session/auth cookies when the incoming query token is valid.
    if (auth?.userId && exchanged.authToken) {
        appendSetCookie(
            headers,
            buildCookie(authCookieName, exchanged.authToken, true),
        );
        appendSetCookie(
            headers,
            buildCookie(
                devSessionCookieName,
                exchanged.nextDevSession || devSessionFromQuery,
                false,
            ),
        );
        appendSetCookie(
            headers,
            buildCookie(
                DEFAULT_DEV_SESSION_UPDATED_AT_COOKIE,
                String(Date.now()),
                false,
            ),
        );
    }

    if (exchanged.upstreamSessionSetCookie) {
        appendSetCookie(headers, exchanged.upstreamSessionSetCookie);
    }

    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("__dev_session__");

    const response = NextResponse.redirect(cleanUrl);
    headers.forEach((value, key) => {
        response.headers.append(key, value);
    });
    return response;
}

export async function getAuth(
    request: Request,
    options: WachtMiddlewareOptions = {},
): Promise<NextWachtAuth> {
    const authCookieName = options.authCookieName || DEFAULT_AUTH_COOKIE;
    const bearerToken = request.headers
        .get("authorization")
        ?.startsWith("Bearer ")
        ? request.headers.get("authorization")!.slice(7).trim()
        : null;
    const authCookieToken = readCookie(request, authCookieName);
    const token = bearerToken || authCookieToken;

    if (token) {
        const sessionAuth = decorateAuth(
            await sdkGetAuthFromToken(token, options),
            request,
            options,
        );
        if (sessionAuth.userId) {
            return sessionAuth;
        }
        const gatewayAuth = await authenticateBearerThroughGateway(
            request,
            token,
            options,
        );
        if (gatewayAuth) return gatewayAuth;
        return sessionAuth;
    }

    return decorateAuth(await sdkGetAuth(request, options), request, options);
}

export async function requireAuth(
    request: Request,
    options: WachtMiddlewareOptions = {},
): Promise<NextWachtAuth> {
    const auth = await getAuth(request, options);
    await auth.protect();
    return auth;
}

export function wachtMiddleware(
    handler?: WachtMiddlewareHandler,
    options: WachtMiddlewareOptions = {},
): (request: NextRequest) => Promise<NextResponse> {
    return async (request: NextRequest) => {
        try {
            const normalizedDevSessionResponse = await normalizeDevSessionQuery(
                request,
                options,
            );
            if (normalizedDevSessionResponse) {
                return normalizedDevSessionResponse;
            }

            const context = await authenticateRequestWithHandshake(
                request,
                options,
            );
            const authState = context.auth;

            if (!handler) {
                const response = NextResponse.next();
                applyAuthHeaders(response, context.headers);
                return response;
            }

            let response: NextResponse;
            try {
                const result = await handler(authState, request);
                if (result instanceof Response) {
                    const location = result.headers.get("Location");
                    if (
                        location &&
                        result.status >= 300 &&
                        result.status < 400
                    ) {
                        response = NextResponse.redirect(
                            new URL(location, request.url),
                            result.status as 301 | 302 | 303 | 307 | 308,
                        );
                    } else {
                        response = new NextResponse(result.body, {
                            status: result.status,
                            statusText: result.statusText,
                            headers: result.headers,
                        });
                    }
                } else if (!result) {
                    response = NextResponse.next();
                } else {
                    response = result as NextResponse;
                }
            } catch (error) {
                if (error instanceof WachtAuthError) {
                    if (
                        error.redirectUrl &&
                        !isApiLikeRequest(request, options)
                    ) {
                        const redirectUrl = new URL(error.redirectUrl, request.url);
                        response = NextResponse.redirect(redirectUrl);
                    } else if (
                        error.code === "unauthenticated" &&
                        !isApiLikeRequest(request, options)
                    ) {
                        const redirectUrl = resolveSignInRedirectUrl(
                            request,
                            options,
                            error.redirectUrl,
                        );
                        response = NextResponse.redirect(
                            new URL(redirectUrl, request.url),
                        );
                    } else {
                        response = NextResponse.json(
                            {
                                error:
                                    error.message ||
                                    (error.status === 401
                                        ? "Unauthorized"
                                        : "Forbidden"),
                            },
                            { status: error.status },
                        );
                    }
                } else {
                    throw error;
                }
            }

            applyAuthHeaders(response, context.headers);
            return response;
        } catch (error) {
            return NextResponse.next();
        }
    };
}

export function createRouteMatcher(
    patterns: string[],
): (req: NextRequest) => boolean {
    const matchers = patterns.map((pattern) => {
        const catchAllPlaceholder = "__WACHT_CATCH_ALL__";
        const regex = pattern
            .replace(/\//g, "\\/")
            // Preserve `(.*)` before the generic `*` replacement runs.
            .replace(/\(\.\*\)/g, catchAllPlaceholder)
            .replace(/\*/g, "[^/]*")
            .replace(new RegExp(catchAllPlaceholder, "g"), ".*")
            .replace(/\(([^)]+)\)/g, "(?:$1)");
        return new RegExp(`^${regex}$`);
    });

    return (req: NextRequest) => {
        const pathname = req.nextUrl.pathname;
        return matchers.some((matcher) => matcher.test(pathname));
    };
}

export function auth(headers: Headers): NextWachtAuth;
export function auth(
    request: Request,
    options?: WachtMiddlewareOptions,
): Promise<NextWachtAuth>;
export function auth(
    value: Headers | Request,
    options: WachtMiddlewareOptions = {},
): NextWachtAuth | Promise<NextWachtAuth> {
    if (value instanceof Headers) {
        return authFromSerializedHeader(parseSerializedNextAuth(value));
    }

    return getAuth(value, options);
}
