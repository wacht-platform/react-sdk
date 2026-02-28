const DEV_SESSION_COOKIE = "__dev_session__";
const DEV_SESSION_UPDATED_AT_COOKIE = "__dev_session_updated_at";
const DEV_SESSION_UPDATED_AT_STORAGE_KEY = "__dev_session_updated_at";

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

function syncStorageFromCookie(): string | null {
  const cookieValue = readCookie(DEV_SESSION_COOKIE);
  if (!cookieValue) return null;

  const cookieUpdatedAt = parseUpdatedAt(readCookie(DEV_SESSION_UPDATED_AT_COOKIE));
  const storageValue = readStorage(DEV_SESSION_COOKIE);
  const storageUpdatedAt = parseUpdatedAt(readStorage(DEV_SESSION_UPDATED_AT_STORAGE_KEY));

  const cookieLooksNewer =
    cookieUpdatedAt > storageUpdatedAt ||
    (cookieUpdatedAt === 0 && cookieValue !== storageValue);

  if (!storageValue || cookieLooksNewer) {
    writeStorage(DEV_SESSION_COOKIE, cookieValue);
    writeStorage(
      DEV_SESSION_UPDATED_AT_STORAGE_KEY,
      String(cookieUpdatedAt || Date.now()),
    );
  }

  return cookieValue;
}

export function getStoredDevSession(): string | null {
  if (!isBrowser()) return null;
  const cookieValue = syncStorageFromCookie();
  if (cookieValue) return cookieValue;
  return readStorage(DEV_SESSION_COOKIE);
}

export function persistDevSession(value: string | null | undefined): void {
  if (!isBrowser() || !value) return;

  const now = Date.now();
  writeCookie(DEV_SESSION_COOKIE, value);
  writeCookie(DEV_SESSION_UPDATED_AT_COOKIE, String(now));
  writeStorage(DEV_SESSION_COOKIE, value);
  writeStorage(DEV_SESSION_UPDATED_AT_STORAGE_KEY, String(now));
}

