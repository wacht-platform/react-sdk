export {
  authenticateRequest,
  getAuth,
  requireAuth,
  type WachtAuth,
  type WachtServerOptions,
  type ProtectOptions,
  type PermissionCheck,
  type JWTPayload,
} from './middleware';
export {
  wachtClient,
  createWachtServerClient,
  type WachtServerClient,
  type WachtServerClientOptions,
} from './client';
