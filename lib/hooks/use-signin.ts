import { Client } from "../types/client";
import { useDeployment } from "./use-deployment";

type ErrorInterface = {
  message: string;
  code: ErrorCode;
};

enum ErrorCode {
  Unknown = "unknown",
  InvalidCredentials = "invalid_credentials",
  UserNotFound = "user_not_found",
  EmailNotFound = "email_not_found",
  PhoneNotFound = "phone_not_found",
  EmailAlreadyExists = "email_already_exists",
  PhoneAlreadyExists = "phone_already_exists",
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
}

type ResultInterface<T, E> =
  | {
      data: never;
      error: E;
    }
  | {
      data: T;
      error: never;
    };

type ApiResult<T, E = ErrorInterface> = Promise<ResultInterface<T, E>>;

type UsernameSignInParams = {
  username: string;
  password: string;
};

type SignInPlainUsername = ({
  username,
  password,
}: UsernameSignInParams) => ApiResult<unknown>;

type EmailSignInParams = {
  email: string;
  password: string;
};

type SignInPlainEmail = ({
  email,
  password,
}: EmailSignInParams) => ApiResult<unknown>;

type GenericSignInParams = {
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
};

type SignInGeneric = ({
  email,
  username,
  password,
  phone,
}: GenericSignInParams) => ApiResult<unknown>;

type PhoneSignInParams = {
  phone: string;
};

type SignInPhone = ({ phone }: PhoneSignInParams) => ApiResult<unknown>;

enum OAuthProvider {
  XOauth = "x_oauth",
  GithubOauth = "github_oauth",
  GitlabOauth = "gitlab_oauth",
  GoogleOauth = "google_oauth",
  FacebookOauth = "facebook_oauth",
  MicrosoftOauth = "microsoft_oauth",
  LinkedinOauth = "linkedin_oauth",
  DiscordOauth = "discord_oauth",
}

type SignInOauth = ({
  provider,
}: {
  provider: OAuthProvider;
}) => ApiResult<unknown>;

export enum SignInStrategy {
  Username = "username",
  Email = "email",
  Phone = "phone",
  Oauth = "oauth",
  Generic = "generic",
}

type VerificationStrategy =
  | "email_otp"
  | "phone_otp"
  | "email_magiclink"
  | "auth_code";

type CreateSignInStrategyResult = {
  (strategy: SignInStrategy.Username): SignInPlainUsername;
  (strategy: SignInStrategy.Email): SignInPlainEmail;
  (strategy: SignInStrategy.Phone): SignInPhone;
  (strategy: SignInStrategy.Oauth): SignInOauth;
  (strategy: SignInStrategy.Generic): SignInGeneric;
};

type SignIn = {
  createStrategy: CreateSignInStrategyResult;
  prepareVerification: (verification: VerificationStrategy) => Promise<unknown>;
  completeVerification: (verificationCode: string) => Promise<unknown>;
};

type UseSignInReturnType =
  | {
      isLoaded: true;
      signIn: SignIn;
    }
  | {
      isLoaded: false;
      signIn: never;
    };

function builder(client: Client): CreateSignInStrategyResult {
  const functionMap = {
    [SignInStrategy.Username]: builderUsername(client),
    [SignInStrategy.Email]: builderEmail(client),
    [SignInStrategy.Phone]: builderPhone(client),
    [SignInStrategy.Oauth]: builderOauth(client),
    [SignInStrategy.Generic]: builderGeneric(client),
  };

  return function signInBuilder(strategy: SignInStrategy) {
    return functionMap[strategy];
  } as CreateSignInStrategyResult;
}

function builderUsername(client: Client): SignInPlainUsername {
  return async ({ username, password }: UsernameSignInParams) => {
    const response = await client("/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    return response.json();
  };
}

function builderEmail(client: Client): SignInPlainEmail {
  return async ({ email, password }: EmailSignInParams) => {
    const response = await client("/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    return response.json();
  };
}

function builderPhone(client: Client): SignInPhone {
  return async ({ phone }: PhoneSignInParams) => {
    const response = await client("/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
      }),
    });
    return response.json();
  };
}

function builderOauth(client: Client): SignInOauth {
  return async ({ provider }: { provider: OAuthProvider }) => {
    const response = await client("/auth/oauth/authorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
      }),
    });
    return response.json();
  };
}

function builderGeneric(client: Client): SignInGeneric {
  return async ({ email, username, password, phone }: GenericSignInParams) => {
    const response = await client("/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        strategy: "generic",
        email,
        username,
        password,
        phone,
      }),
    });
    return response.json();
  };
}

export function useSignIn(): UseSignInReturnType {
  const { client, loading } = useDeployment();

  if (loading) {
    return {
      isLoaded: false,
    } as UseSignInReturnType;
  }

  return {
    isLoaded: !loading,
    signIn: {
      createStrategy: builder(client!),
      completeVerification: async (verificationCode: string) => {
        console.log(verificationCode);
      },
      prepareVerification: async (verification: VerificationStrategy) => {
        console.log(verification);
      },
    },
  };
}

type SignInFunction<T extends SignInStrategy> = {
  [SignInStrategy.Username]: SignInPlainUsername;
  [SignInStrategy.Email]: SignInPlainEmail;
  [SignInStrategy.Phone]: SignInPhone;
  [SignInStrategy.Oauth]: SignInOauth;
  [SignInStrategy.Generic]: SignInGeneric;
}[T];

type UseSignInWithStrategyReturnType<T extends SignInStrategy> =
  | {
      isLoaded: false;
      signIn: never;
    }
  | {
      isLoaded: true;
      signIn: {
        create: SignInFunction<T>;
        completeVerification: (verificationCode: string) => Promise<unknown>;
        prepareVerification: (
          verification: VerificationStrategy,
        ) => Promise<unknown>;
      };
    };

export function useSignInWithStrategy<T extends SignInStrategy>(
  strategy: T,
): UseSignInWithStrategyReturnType<T> {
  const { client, loading } = useDeployment();

  if (loading) {
    return {
      isLoaded: false,
    } as UseSignInWithStrategyReturnType<T>;
  }

  const strategyFunction = (() => {
    switch (strategy) {
      case SignInStrategy.Username:
        return builderUsername(client!);
      case SignInStrategy.Email:
        return builderEmail(client!);
      case SignInStrategy.Phone:
        return builderPhone(client!);
      case SignInStrategy.Oauth:
        return builderOauth(client!);
      case SignInStrategy.Generic:
        return builderGeneric(client!);
      default:
        throw new Error("Invalid sign-in strategy");
    }
  })();

  return {
    isLoaded: true,
    signIn: {
      create: strategyFunction,
      completeVerification: async (verificationCode: string) => {
        console.log(verificationCode);
      },
      prepareVerification: async (verification: VerificationStrategy) => {
        console.log(verification);
      },
    },
  } as UseSignInWithStrategyReturnType<T>;
}
