import {
  getAuth as sdkGetAuth,
  getAuthFromToken as sdkGetAuthFromToken,
  parseFrontendApiUrlFromPublishableKey,
  type JWTPayload,
  type PermissionCheck,
  type ProtectOptions,
  type WachtAuth,
  type WachtServerOptions,
} from "@wacht/backend";

export type { WachtAuth, WachtServerOptions, ProtectOptions, PermissionCheck, JWTPayload };

const AUTH_HEADER = "x-wacht-auth";
const DEFAULT_SESSION_COOKIE = "__session";
const DEFAULT_DEV_SESSION_COOKIE = "__dev_session__";
const DEFAULT_DEV_SESSION_UPDATED_AT_COOKIE = "__dev_session_updated_at";
const DEFAULT_AUTH_COOKIE = "__auth";
const DEV_SESSION_HEADER = "x-development-session";

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

function getFrontendApiUrl(options: WachtServerOptions): string {
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

async function exchangeSessionForAuthToken(
  options: WachtServerOptions,
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
    const sessionCookieName = options.sessionCookieName || DEFAULT_SESSION_COOKIE;
    headers.set("Cookie", `${sessionCookieName}=${encodeURIComponent(sessionToken)}`);
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

function setSerializedAuthHeader(headers: Headers, auth: WachtAuth): void {
  headers.set(
    AUTH_HEADER,
    JSON.stringify({
      userId: auth.userId,
      sessionId: auth.sessionId,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      organizationPermissions: auth.organizationPermissions,
      workspacePermissions: auth.workspacePermissions,
    }),
  );
}

export async function getAuth(
  request: Request,
  options: WachtServerOptions = {},
): Promise<WachtAuth> {
  const authCookieName = options.authCookieName || DEFAULT_AUTH_COOKIE;
  const bearerToken = request.headers.get("authorization")?.startsWith("Bearer ")
    ? request.headers.get("authorization")!.slice(7).trim()
    : null;
  const authCookieToken = readCookie(request, authCookieName);
  const token = bearerToken || authCookieToken;

  if (token) {
    return sdkGetAuthFromToken(token, options);
  }

  return sdkGetAuth(request, options);
}

export async function requireAuth(
  request: Request,
  options: WachtServerOptions = {},
): Promise<WachtAuth> {
  const auth = await getAuth(request, options);
  await auth.protect();
  return auth;
}

export async function authenticateRequest(
  request: Request,
  options: WachtServerOptions = {},
): Promise<{ auth: WachtAuth; headers: Headers }> {
  const headers = new Headers();
  const authCookieName = options.authCookieName || DEFAULT_AUTH_COOKIE;
  const sessionCookieName = options.sessionCookieName || DEFAULT_SESSION_COOKIE;
  const devSessionCookieName = options.devSessionCookieName || DEFAULT_DEV_SESSION_COOKIE;

  const bearerToken = request.headers.get("authorization")?.startsWith("Bearer ")
    ? request.headers.get("authorization")!.slice(7).trim()
    : null;
  const authCookieToken = readCookie(request, authCookieName);

  for (const token of [bearerToken, authCookieToken]) {
    if (!token) continue;
    const auth = await sdkGetAuthFromToken(token, options);
    if (!auth.userId) continue;
    setSerializedAuthHeader(headers, auth);
    return { auth, headers };
  }

  const sessionToken = readCookie(request, sessionCookieName);
  const devSessionToken = readCookie(request, devSessionCookieName);
  const isDevSession = !sessionToken && !!devSessionToken;
  const transportToken = sessionToken || devSessionToken;

  if (!transportToken) {
    const auth = await sdkGetAuth(request, options);
    setSerializedAuthHeader(headers, auth);
    return { auth, headers };
  }

  const exchanged = await exchangeSessionForAuthToken(options, transportToken, isDevSession);
  const auth = exchanged.authToken
    ? await sdkGetAuthFromToken(exchanged.authToken, options)
    : await sdkGetAuth(request, options);

  if (exchanged.authToken && auth.userId) {
    appendSetCookie(headers, buildCookie(authCookieName, exchanged.authToken, true));
  }

  if (exchanged.nextDevSession) {
    appendSetCookie(headers, buildCookie(devSessionCookieName, exchanged.nextDevSession, false));
    appendSetCookie(
      headers,
      buildCookie(DEFAULT_DEV_SESSION_UPDATED_AT_COOKIE, String(Date.now()), false),
    );
  }

  if (exchanged.upstreamSessionSetCookie) {
    appendSetCookie(headers, exchanged.upstreamSessionSetCookie);
  }

  setSerializedAuthHeader(headers, auth);
  return { auth, headers };
}
