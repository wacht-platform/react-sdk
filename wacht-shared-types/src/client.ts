export type Client = (
  url: URL | string,
  options?: RequestInit
) => Promise<Response>;

export type ClinetReponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ErrorInterface = {
  message: string;
  code: ErrorCode;
};

export enum ErrorCode {
  Unknown = "unknown",
  UserNotFound = "USER_NOT_FOUND",
  UserDisabled = "USER_DISABLED",
  MissingVerificationCode = "missing_verification_code",
  VerificationCodeExpired = "verification_code_expired",
  UsernameExists = "USERNAME_EXISTS",
  EmailExists = "EMAIL_EXISTS",
  InvalidCredentials = "INVALID_CREDENTIALS",
  UserAlreadySignedIn = "USER_ALREADY_SIGNED_IN",
  PhoneNumberExists = "PHONE_NUMBER_EXISTS",
  OauthCompletionFailed = "OAUTH_COMPLETION_FAILED",
  ProviderRequired = "PROVIDER_REQUIRED",
  CodeRequired = "CODE_REQUIRED",
  VerificationStrategyRequired = "VERIFICATION_STRATEGY_REQUIRED",
  InvalidState = "INVALID_STATE",
  InvalidCode = "INVALID_CODE",
  RequiredField = "REQUIRED_FIELD",
  BadRequestBody = "BAD_REQUEST_BODY",
  ProviderNotConfigured = "PROVIDER_NOT_CONFIGURED",
  SignupRestricted = "SIGNUP_RESTRICTED",
  SignupWaitlistOnly = "SIGNUP_WAITLIST_ONLY",
  EmailNotAllowed = "EMAIL_NOT_ALLOWED",
  EmailBlocked = "EMAIL_BLOCKED",
  DisposableEmailBlocked = "DISPOSABLE_EMAIL_BLOCKED",
  CountryRestricted = "COUNTRY_RESTRICTED",
  VoipNumberBlocked = "VOIP_NUMBER_BLOCKED",
  BannedKeyword = "BANNED_KEYWORD",
  NoAlternativeAuthMethod = "NO_ALTERNATIVE_AUTH_METHOD",
  Internal = "INTERNAL",
  BadSignInAttempt = "BAD_SIGN_IN_ATTEMPT",
}

export type ResultInterface<T, E> =
  | {
      data: never;
      errors: E[];
    }
  | {
      data: T;
      errors: never;
    };

export type ApiResult<T, E = ErrorInterface> = ResultInterface<T, E>;
