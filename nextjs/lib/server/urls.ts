import { NextRequest, NextResponse } from 'next/server';
import { getFrontendApiUrl } from './cookies';
import type { WachtMiddlewareOptions } from './middleware';

export function isApiLikeRequest(
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
  return options.apiRoutePrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function applyAuthHeaders(response: NextResponse, headers: Headers): void {
  headers.forEach((value, key) => {
    response.headers.append(key, value);
  });
}

export function deriveAccountPortalSignInBaseUrl(frontendApiUrl: string): string {
  const frontend = new URL(frontendApiUrl);
  const labels = frontend.hostname.split('.');

  if (labels.length < 3) {
    return `${frontend.origin.replace(/\/$/, '')}/sign-in`;
  }

  const portalLabels = [...labels];
  if (portalLabels[0] === 'frontend') {
    portalLabels[0] = 'accounts';
  } else if (portalLabels[1] === 'fapi') {
    portalLabels[1] = 'accounts';
  } else {
    portalLabels.splice(1, 0, 'accounts');
  }

  return `${frontend.protocol}//${portalLabels.join('.')}/sign-in`;
}

function isInternalHost(hostname: string): boolean {
  return (
    hostname === '0.0.0.0' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

function pickForwardedHeader(headers: Headers, key: string): string | null {
  const raw = headers.get(key);
  if (!raw) return null;
  return raw.split(',')[0]?.trim() || null;
}

function hasExplicitPort(host: string): boolean {
  if (host.startsWith('[')) {
    return host.includes(']:');
  }

  return host.includes(':');
}

function normalizePortForProtocol(port: string | null, protocol: string): string {
  if (!port) return '';
  if ((protocol === 'https' && port === '443') || (protocol === 'http' && port === '80')) {
    return '';
  }

  return port;
}

export function resolvePublicRequestUrl(request: Request | NextRequest): string {
  const originalUrl = new URL(request.url);
  const url = new URL(request.url);
  const forwardedHost =
    pickForwardedHeader(request.headers, 'x-forwarded-host') ||
    pickForwardedHeader(request.headers, 'host');
  const forwardedProto =
    pickForwardedHeader(request.headers, 'x-forwarded-proto') ||
    url.protocol.replace(':', '');
  const forwardedPort = pickForwardedHeader(request.headers, 'x-forwarded-port');

  if (forwardedHost) {
    url.protocol = `${forwardedProto}:`;

    if (hasExplicitPort(forwardedHost)) {
      url.host = forwardedHost;
    } else {
      url.hostname = forwardedHost;
      url.port = normalizePortForProtocol(forwardedPort, forwardedProto);
    }
  }

  if (isInternalHost(url.hostname)) {
    url.hostname = 'localhost';

    if (!forwardedHost) {
      url.port = originalUrl.port;
    }
  }

  return url.toString();
}

export function resolveSignInRedirectUrl(
  request: NextRequest,
  options: WachtMiddlewareOptions,
  explicitRedirectUrl?: string,
): string {
  const base =
    explicitRedirectUrl ||
    options.signInUrl ||
    deriveAccountPortalSignInBaseUrl(getFrontendApiUrl(options));
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}redirect_uri=${encodeURIComponent(resolvePublicRequestUrl(request))}`;
}
