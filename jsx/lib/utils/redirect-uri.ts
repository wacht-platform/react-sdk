import type { Deployment } from "@/types";

function stripPort(host: string): string {
  const idx = host.indexOf(":");
  return idx >= 0 ? host.slice(0, idx) : host;
}

function parseHost(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

function parseUri(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    if (typeof window === "undefined") return null;
    try {
      return new URL(value, window.location.origin);
    } catch {
      return null;
    }
  }
}

function hostsMatch(redirectHost: string, frontendHost: string): boolean {
  if (!redirectHost || !frontendHost) return false;
  if (redirectHost === frontendHost) return true;
  return redirectHost.endsWith(`.${frontendHost}`);
}

export function isRedirectUriAllowed(
  deployment: Deployment | null | undefined,
  redirectUri: string | null | undefined,
): boolean {
  if (!redirectUri) return false;
  const parsed = parseUri(redirectUri);
  if (!parsed) return false;
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  // Staging is intentionally permissive (devs use localhost, preview hosts, etc.).
  // Anything else — production, unknown mode, missing deployment — falls through to strict checks.
  if (deployment?.mode === "staging") return true;

  if (parsed.protocol !== "https:") return false;
  if (!deployment?.frontend_host) return false;

  const frontendHost = parseHost(stripPort(deployment.frontend_host));
  if (!frontendHost) return false;

  return hostsMatch(parsed.hostname.toLowerCase(), frontendHost);
}

/**
 * Returns the requested redirect URI if it is allowed for this deployment,
 * otherwise null. Callers should fall back to deployment.ui_settings.after_signin_redirect_url
 * or deployment.frontend_host (both deployment-trusted) when this returns null.
 *
 * Production: scheme must be https, host must equal deployment.frontend_host or be a subdomain of it.
 * Staging: any http(s) redirect is allowed (devs commonly redirect to localhost or arbitrary preview hosts).
 */
export function sanitizeRedirectUri(
  deployment: Deployment | null | undefined,
  redirectUri: string | null | undefined,
): string | null {
  if (!redirectUri) return null;
  return isRedirectUriAllowed(deployment, redirectUri) ? redirectUri : null;
}
