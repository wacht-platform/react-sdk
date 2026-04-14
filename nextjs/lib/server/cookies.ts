import type { WachtMiddlewareOptions } from './middleware';
import { parseFrontendApiUrlFromPublishableKey } from '@wacht/backend';

export const AUTH_HEADER = 'x-wacht-auth';
export const DEFAULT_SESSION_COOKIE = '__session';
export const DEFAULT_DEV_SESSION_COOKIE = '__dev_session__';
export const DEFAULT_DEV_SESSION_UPDATED_AT_COOKIE = '__dev_session_updated_at';
export const DEFAULT_AUTH_COOKIE = '__auth';
export const DEV_SESSION_HEADER = 'x-development-session';

export type CookieNames = {
  authCookieName: string;
  sessionCookieName: string;
  devSessionCookieName: string;
  devSessionUpdatedAtCookieName: string;
  authRefreshCookieName: string;
};

export function readCookie(request: Request, cookieName: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== cookieName) continue;
    return decodeURIComponent(rest.join('='));
  }

  return null;
}

export function appendSetCookie(headers: Headers, value: string): void {
  headers.append('Set-Cookie', value);
}

export function buildCookie(
  name: string,
  value: string,
  httpOnly: boolean,
  options?: { maxAge?: number },
): string {
  const encoded = encodeURIComponent(value);
  const maxAge =
    typeof options?.maxAge === 'number' ? `; Max-Age=${Math.trunc(options.maxAge)}` : '';
  return `${name}=${encoded}; Path=/; Secure; SameSite=Lax${httpOnly ? '; HttpOnly' : ''}${maxAge}`;
}

export function getFrontendApiUrl(options: WachtMiddlewareOptions): string {
  const parsed = parseFrontendApiUrlFromPublishableKey(
    options.publishableKey ||
      process.env.NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY ||
      process.env.WACHT_PUBLISHABLE_KEY,
  );

  if (!parsed) {
    throw new Error(
      'Unable to derive frontend API URL from publishable key. Set NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY.',
    );
  }

  return parsed;
}

function sanitizeCookieScope(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);

  return sanitized || 'default';
}

export function resolveCookieNames(options: WachtMiddlewareOptions): CookieNames {
  const sessionCookieName = options.sessionCookieName || DEFAULT_SESSION_COOKIE;
  const frontendApiHost = new URL(getFrontendApiUrl(options)).host;
  const scope = sanitizeCookieScope(frontendApiHost);
  const devSessionCookieName =
    options.devSessionCookieName || `${DEFAULT_DEV_SESSION_COOKIE}_${scope}`;

  return {
    authCookieName: options.authCookieName || `${DEFAULT_AUTH_COOKIE}_${scope}`,
    sessionCookieName,
    devSessionCookieName,
    devSessionUpdatedAtCookieName: `${DEFAULT_DEV_SESSION_UPDATED_AT_COOKIE}_${scope}`,
    authRefreshCookieName: `__auth_refresh_${scope}`,
  };
}
