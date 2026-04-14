import { NextRequest, NextResponse } from "next/server";
import type { NextMiddlewareResult } from "next/dist/server/web/types";
import {
    getAuth as sdkGetAuth,
    getAuthFromToken as sdkGetAuthFromToken,
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
import {
    authFromSerializedHeader,
    decorateAuth,
    parseSerializedNextAuth,
} from "./auth-state";
import { readCookie, resolveCookieNames } from "./cookies";
import { authenticateRequestWithHandshake, normalizeDevSessionQuery } from "./session";
import { applyAuthHeaders, isApiLikeRequest, resolveSignInRedirectUrl } from "./urls";

export type { WachtAuth, ProtectOptions, PermissionCheck, JWTPayload };
export type {
    SessionPrincipalIdentity,
    SessionPrincipalMetadata,
} from "@wacht/backend";

export interface RedirectToSignInOptions {
    returnBackUrl?: string | URL;
}

export type WachtTokenType =
    | "session_token"
    | "oauth_token"
    | "machine_token"
    | "api_key";

export type WachtAcceptedTokenType = WachtTokenType | "any" | WachtTokenType[];

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
    debugAuth?: boolean;
}

export interface AuthenticatedRequest extends NextRequest {
    auth: NextWachtAuth;
}

type WachtMiddlewareHandler = (
    authState: NextWachtAuth,
    request: NextRequest,
) => NextMiddlewareResult | Promise<NextMiddlewareResult>;

export async function getAuth(
    request: Request,
    options: WachtMiddlewareOptions = {},
): Promise<NextWachtAuth> {
    const { authCookieName } = resolveCookieNames(options);
    const bearerToken = request.headers
        .get("authorization")
        ?.startsWith("Bearer ")
        ? request.headers.get("authorization")!.slice(7).trim()
        : null;
    const authCookieToken = readCookie(request, authCookieName);
    const token = bearerToken || authCookieToken;

    if (token) {
        return decorateAuth(await sdkGetAuthFromToken(token, options), request, options);
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
            const debugAuth = options.debugAuth || process.env.WACHT_DEBUG_AUTH === "1";

            if (context.shouldRefreshRequest && !isApiLikeRequest(request, options)) {
                const response = NextResponse.redirect(request.nextUrl);
                applyAuthHeaders(request, response, context.headers);
                if (debugAuth) {
                    context.debug["response_mode"] = "refresh_redirect";
                    applyDebugHeaders(response, context.debug);
                }
                return response;
            }

            if (!handler) {
                const response = NextResponse.next();
                applyAuthHeaders(request, response, context.headers);
                if (debugAuth) {
                    context.debug["response_mode"] = "next";
                    applyDebugHeaders(response, context.debug);
                }
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
                        const redirectUrl = new URL(
                            error.redirectUrl,
                            request.url,
                        );
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
                    if (debugAuth) {
                        context.debug["auth_error_code"] = error.code;
                        context.debug["auth_error_status"] = String(error.status);
                    }
                } else {
                    throw error;
                }
            }

            applyAuthHeaders(request, response, context.headers);
            if (debugAuth) {
                context.debug["response_mode"] =
                    String(response.status).startsWith("3") ? "redirect" : "handled";
                applyDebugHeaders(response, context.debug);
            }
            return response;
        } catch {
            return NextResponse.next();
        }
    };
}

function applyDebugHeaders(
    response: NextResponse,
    debug: Record<string, string>,
): void {
    for (const [key, value] of Object.entries(debug)) {
        response.headers.set(`x-wacht-debug-${key}`, value);
    }
}

export function createRouteMatcher(
    patterns: string[],
): (req: NextRequest) => boolean {
    const matchers = patterns.map((pattern) => {
        const catchAllPlaceholder = "__WACHT_CATCH_ALL__";
        const regex = pattern
            .replace(/\//g, "\\/")
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
