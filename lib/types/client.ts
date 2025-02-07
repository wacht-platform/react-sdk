export type Client = (
  url: URL | string,
  options?: RequestInit,
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
  UserNotFound = "user_not_found",
  EmailNotFound = "email_not_found",
  PhoneNotFound = "phone_not_found",
  UserAlreadyExists = "user_already_exists",
  InvalidEmail = "invalid_email",
  InvalidPhone = "invalid_phone",
  InvalidUsername = "invalid_username",
  InvalidPassword = "invalid_password",
  MissingPassword = "missing_password",
  MissingUsername = "missing_username",
  MissingEmail = "missing_email",
  MissingPhone = "missing_phone",
  MissingProvider = "missing_provider",
  InvalidProvider = "invalid_provider",
  MissingVerificationCode = "missing_verification_code",
  VerificationCodeExpired = "verification_code_expired",
  UsernameExist = "USERNAME_EXISTS",
  EmailExists = "EMAIL_EXISTS",
  InvalidCredentials = "INVALID_CREDENTIALS",
  UserAlreadySignedIn = "USER_ALREADY_SIGNED_IN",
  PhoneNumberExists = "PHONE_NUMBER_EXISTS",
}


export type ResultInterface<T, E> =
  | {
    data: never;
    errors?: E[];
  }
  | {
    data: T;
    errors?: never;
  };


export type ApiResult<T, E = ErrorInterface> = ResultInterface<T, E>;