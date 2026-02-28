export {
  wachtMiddleware,
  createRouteMatcher,
  auth,
  getAuth,
  requireAuth,
  type WachtAuth,
  type NextWachtAuth,
  type WachtMiddlewareOptions,
  type AuthenticatedRequest,
  type ProtectOptions,
  type NextProtectOptions,
  type WachtTokenType,
  type WachtAcceptedTokenType,
  type SessionPrincipalIdentity,
  type SessionPrincipalMetadata,
  type WachtPrincipalIdentity,
  type PermissionCheck,
  type JWTPayload,
  type RedirectToSignInOptions,
} from './middleware';
export { WachtAuthError } from '@wacht/backend';
export {
  wachtClient,
  createWachtServerClient,
  type WachtServerClient,
  type WachtServerClientOptions,
} from './client';
