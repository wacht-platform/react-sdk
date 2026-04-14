import {
  authenticateRequest as backendAuthenticateRequest,
  authFromHeaders as backendAuthFromHeaders,
  getAuth as backendGetAuth,
  type JWTPayload,
  type PermissionCheck,
  type ProtectOptions,
  type WachtAuth,
  type WachtServerOptions,
} from '@wacht/backend';

export type { WachtAuth, WachtServerOptions, ProtectOptions, PermissionCheck, JWTPayload };

export async function getAuth(
  request: Request,
  options: WachtServerOptions = {},
): Promise<WachtAuth> {
  return backendGetAuth(request, options);
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
  return backendAuthenticateRequest(request, options);
}

export function authFromHeaders(headers: Headers): WachtAuth {
  return backendAuthFromHeaders(headers);
}
