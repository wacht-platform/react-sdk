const DEV_SESSION_COOKIE = "__dev_session__";
const DEV_SESSION_UPDATED_AT_COOKIE = "__dev_session_updated_at";
const DEV_SESSION_UPDATED_AT_STORAGE_KEY = "__dev_session_updated_at";

type DevSessionKeys = {
  cookie: string;
  updatedAtCookie: string;
  storage: string;
  updatedAtStorage: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const part of cookies) {
    const [cookieName, ...rest] = part.trim().split("=");
    if (cookieName !== name) continue;
    return decodeURIComponent(rest.join("="));
  }
  return null;
}

function writeCookie(name: string, value: string): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Secure; SameSite=Lax`;
}

function readStorage(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors.
  }
}

function parseUpdatedAt(value: string | null): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeScope(scope?: string | null): string | null {
  const value = scope?.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    return parsed.host.toLowerCase();
  } catch {
    return value.toLowerCase().replace(/\/+$/, "");
  }
}

function getScopeSuffix(scope?: string | null): string {
  const normalized = normalizeScope(scope);
  if (!normalized) return "";

  const sanitized = normalized
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);

  return sanitized ? `_${sanitized}` : "";
}

function getDevSessionKeys(scope?: string | null): DevSessionKeys {
  const suffix = getScopeSuffix(scope);

  return {
    cookie: `${DEV_SESSION_COOKIE}${suffix}`,
    updatedAtCookie: `${DEV_SESSION_UPDATED_AT_COOKIE}${suffix}`,
    storage: `${DEV_SESSION_COOKIE}${suffix}`,
    updatedAtStorage: `${DEV_SESSION_UPDATED_AT_STORAGE_KEY}${suffix}`,
  };
}

function syncStorageFromCookie(keys: DevSessionKeys): string | null {
  const cookieValue = readCookie(keys.cookie);
  if (!cookieValue) return null;

  const cookieUpdatedAt = parseUpdatedAt(readCookie(keys.updatedAtCookie));
  const storageValue = readStorage(keys.storage);
  const storageUpdatedAt = parseUpdatedAt(readStorage(keys.updatedAtStorage));

  const cookieLooksNewer =
    cookieUpdatedAt > storageUpdatedAt ||
    (cookieUpdatedAt === 0 && cookieValue !== storageValue);

  if (!storageValue || cookieLooksNewer) {
    writeStorage(keys.storage, cookieValue);
    writeStorage(
      keys.updatedAtStorage,
      String(cookieUpdatedAt || Date.now()),
    );
  }

  return cookieValue;
}

export function getStoredDevSession(scope?: string | null): string | null {
  if (!isBrowser()) return null;
  const keys = getDevSessionKeys(scope);
  const cookieValue = syncStorageFromCookie(keys);
  if (cookieValue) return cookieValue;
  return readStorage(keys.storage);
}

export function persistDevSession(
  value: string | null | undefined,
  scope?: string | null,
): void {
  if (!isBrowser() || !value) return;

  const keys = getDevSessionKeys(scope);
  const now = Date.now();
  writeCookie(keys.cookie, value);
  writeCookie(keys.updatedAtCookie, String(now));
  writeStorage(keys.storage, value);
  writeStorage(keys.updatedAtStorage, String(now));
}
