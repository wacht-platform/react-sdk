import { useState } from "react";
import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import type { ApiResult, Client, ErrorInterface } from "@/types";
import type { Session, SigninAttempt, ProfileCompletionData } from "@/types";

type UsernameSignInParams = {
  username: string;
  password: string;
};

type SignInPlainUsername = ({
  username,
  password,
}: UsernameSignInParams) => Promise<ApiResult<Session>>;

type EmailSignInParams = {
  email: string;
  password: string;
};

type SignInPlainEmail = ({
  email,
  password,
}: EmailSignInParams) => Promise<ApiResult<Session>>;

type GenericSignInParams = {
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
  strategy?: string;
};

type SignInGeneric = ({
  email,
  username,
  password,
  phone,
  strategy,
}: GenericSignInParams) => Promise<ApiResult<Session>>;

type PhoneSignInParams = {
  phone: string;
};

type SignInPhone = ({
  phone,
}: PhoneSignInParams) => Promise<ApiResult<Session>>;

type EmailOTPSignInParams = {
  email: string;
};

type SignInEmailOTP = ({
  email,
}: EmailOTPSignInParams) => Promise<ApiResult<Session>>;

type MagicLinkSignInParams = {
  email: string;
};

type SignInMagicLink = ({
  email,
}: MagicLinkSignInParams) => Promise<ApiResult<Session>>;

export enum OAuthProvider {
  XOauth = "x_oauth",
  GithubOauth = "github_oauth",
  GitlabOauth = "gitlab_oauth",
  GoogleOauth = "google_oauth",
  FacebookOauth = "facebook_oauth",
  MicrosoftOauth = "microsoft_oauth",
  LinkedinOauth = "linkedin_oauth",
  DiscordOauth = "discord_oauth",
  AppleOauth = "apple_oauth",
}

type SignInOauth = ({
  provider,
  redirectUri,
}: {
  provider: OAuthProvider;
  redirectUri?: string;
}) => Promise<ApiResult<InitSSOResponseType>>;

export enum SignInStrategy {
  Username = "username",
  Email = "email",
  Phone = "phone",
  EmailOTP = "email_otp",
  MagicLink = "magic_link",
  Oauth = "oauth",
  Generic = "generic",
}

// Declarative verification parameter types
type EmailOTPVerificationParams = {
  strategy: "email_otp";
  redirectUri?: string;
};

type PhoneOTPVerificationParams = {
  strategy: "phone_otp";
  lastDigits?: string;
};

type MagicLinkVerificationParams = {
  strategy: "magic_link";
  redirectUri?: string;
};

type VerificationParams =
  | EmailOTPVerificationParams
  | PhoneOTPVerificationParams
  | MagicLinkVerificationParams;

type PrepareVerificationResponse = {
  otp_sent?: boolean;
  masked_phone?: string;
  masked_email?: string;
  verification_method?: string;
};

type CreateSignInStrategyResult = {
  (strategy: SignInStrategy.Username): SignInPlainUsername;
  (strategy: SignInStrategy.Email): SignInPlainEmail;
  (strategy: SignInStrategy.Phone): SignInPhone;
  (strategy: SignInStrategy.EmailOTP): SignInEmailOTP;
  (strategy: SignInStrategy.MagicLink): SignInMagicLink;
  (strategy: SignInStrategy.Oauth): SignInOauth;
  (strategy: SignInStrategy.Generic): SignInGeneric;
};

type SignIn = {
  createStrategy: CreateSignInStrategyResult;
  prepareVerification: (
    params: VerificationParams,
  ) => Promise<ApiResult<PrepareVerificationResponse>>;
  completeVerification: (verificationCode: string) => Promise<Session>;
  completeProfile: (data: ProfileCompletionData) => Promise<Session>;
};

type UseSignInReturnType =
  | {
      loading: false;
      signIn: SignIn;
      signinAttempt: SigninAttempt | null;
      discardSignInAttempt: () => void;
      setSignInAttempt: (attempt: SigninAttempt | null) => void;
      error: ApiResult<unknown, ErrorInterface> | null;
    }
  | {
      loading: true;
      signIn: never;
      signinAttempt: null;
      discardSignInAttempt: () => void;
      setSignInAttempt: (attempt: SigninAttempt | null) => void;
      error: null;
    };

type InitSSOResponseType = {
  oauth_url: string;
  session: Session;
};

function builder(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
  setError: (error: ApiResult<unknown, ErrorInterface> | null) => void,
): CreateSignInStrategyResult {
  const functionMap = {
    [SignInStrategy.Username]: builderUsername(
      client,
      setSignInAttempt,
      setError,
    ),
    [SignInStrategy.Email]: builderEmail(client, setSignInAttempt, setError),
    [SignInStrategy.Phone]: builderPhone(client, setSignInAttempt, setError),
    [SignInStrategy.EmailOTP]: builderEmailOTP(
      client,
      setSignInAttempt,
      setError,
    ),
    [SignInStrategy.MagicLink]: builderMagicLink(
      client,
      setSignInAttempt,
      setError,
    ),
    [SignInStrategy.Oauth]: builderOauth(client, setError),
    [SignInStrategy.Generic]: builderGeneric(
      client,
      setSignInAttempt,
      setError,
    ),
  };

  return function signInBuilder(strategy: SignInStrategy) {
    return functionMap[strategy];
  } as CreateSignInStrategyResult;
}

function builderUsername(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
  setError: (error: ApiResult<unknown, ErrorInterface> | null) => void,
): SignInPlainUsername {
  return async ({ username, password }: UsernameSignInParams) => {
    const form = new FormData();
    form.append("strategy", "plain_username");
    form.append("username", username);
    form.append("password", password);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await responseMapper<Session>(response);
    if ("data" in result && result.data?.signin_attempts?.length) {
      setSignInAttempt(result.data.signin_attempts.at(-1) || null);
      setError(null);
    } else {
      setError(result);
    }
    return result;
  };
}

function builderEmail(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
  setError: (error: ApiResult<unknown, ErrorInterface> | null) => void,
): SignInPlainEmail {
  return async ({ email, password }: EmailSignInParams) => {
    const form = new FormData();
    form.append("strategy", "plain_email");
    form.append("email", email);
    form.append("password", password);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await responseMapper<Session>(response);
    if ("data" in result && result.data?.signin_attempts?.length) {
      setSignInAttempt(result.data.signin_attempts.at(-1) || null);
      setError(null);
    } else {
      setError(result);
    }
    return result;
  };
}

function builderPhone(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
  setError: (error: ApiResult<unknown, ErrorInterface> | null) => void,
): SignInPhone {
  return async ({ phone }: PhoneSignInParams) => {
    const form = new FormData();
    form.append("strategy", "phone_otp");
    form.append("phone", phone);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await responseMapper<Session>(response);
    if ("data" in result && result.data?.signin_attempts?.length) {
      setSignInAttempt(result.data.signin_attempts.at(-1) || null);
      setError(null);
    } else {
      setError(result);
    }
    return result;
  };
}

function builderEmailOTP(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
  setError: (error: ApiResult<unknown, ErrorInterface> | null) => void,
): SignInEmailOTP {
  return async ({ email }: EmailOTPSignInParams) => {
    const form = new FormData();
    form.append("strategy", "email_otp");
    form.append("email", email);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await responseMapper<Session>(response);
    if ("data" in result && result.data?.signin_attempts?.length) {
      setSignInAttempt(result.data.signin_attempts.at(-1) || null);
      setError(null);
    } else {
      setError(result);
    }
    return result;
  };
}

function builderMagicLink(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
  setError: (error: ApiResult<unknown, ErrorInterface> | null) => void,
): SignInMagicLink {
  return async ({ email }: MagicLinkSignInParams) => {
    const form = new FormData();
    form.append("strategy", "magic_link");
    form.append("email", email);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await responseMapper<Session>(response);
    if ("data" in result && result.data?.signin_attempts?.length) {
      setSignInAttempt(result.data.signin_attempts.at(-1) || null);
      setError(null);
    } else {
      setError(result);
    }
    return result;
  };
}

function builderOauth(
  client: Client,
  setError: (error: ApiResult<unknown, ErrorInterface> | null) => void,
): SignInOauth {
  return async ({
    provider,
    redirectUri,
  }: {
    provider: OAuthProvider;
    redirectUri?: string;
  }) => {
    const params = new URLSearchParams({ provider });
    if (redirectUri) {
      params.append("redirect_uri", redirectUri);
    }

    const response = await client(`/auth/oauth2/init?${params.toString()}`, {
      method: "POST",
    });
    const result = await responseMapper<InitSSOResponseType>(response);
    if ("data" in result) {
      setError(null);
      if (result.data.oauth_url) {
        window.location.href = result.data.oauth_url;
      }
    } else {
      setError(result);
    }
    return result;
  };
}

function builderGeneric(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
  setError: (error: ApiResult<unknown, ErrorInterface> | null) => void,
): SignInGeneric {
  return async ({
    email,
    username,
    password,
    phone,
    strategy,
  }: GenericSignInParams) => {
    const form = new FormData();

    if (strategy) {
      form.append("strategy", strategy);
    }
    if (email) form.append("email", email);
    if (username) form.append("username", username);
    if (password) form.append("password", password);
    if (phone) form.append("phone", phone);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await responseMapper<Session>(response);
    if ("data" in result && result.data?.signin_attempts?.length) {
      setSignInAttempt(result.data.signin_attempts.at(-1) || null);
      setError(null);
    } else {
      setError(result);
    }
    return result as ApiResult<Session>;
  };
}

export function useSignIn(): UseSignInReturnType {
  const { client, loading } = useClient();
  const [signinAttempt, setSignInAttempt] = useState<SigninAttempt | null>(
    null,
  );
  const [error, setError] = useState<ApiResult<unknown, ErrorInterface> | null>(
    null,
  );

  if (loading) {
    return {
      loading: true,
      signIn: null as never,
      signinAttempt: null,
      discardSignInAttempt: () => {
        setSignInAttempt(null);
        setError(null);
      },
      setSignInAttempt,
      error: null,
    } as UseSignInReturnType;
  }

  return {
    loading: false,
    signinAttempt,
    signIn: {
      createStrategy: builder(client, setSignInAttempt, setError),
      completeVerification: async (verificationCode: string) => {
        const form = new FormData();
        form.append("verification_code", verificationCode);

        const response = await client(
          `/auth/attempt-verification?attempt_identifier=${signinAttempt?.id}&identifier_type=signin`,
          {
            method: "POST",
            body: form,
          },
        );

        const result = await responseMapper<Session>(response);
        if ("data" in result && result.data?.signin_attempts?.length) {
          const latestAttempt = result.data.signin_attempts.at(-1);
          setSignInAttempt(latestAttempt || null);
          setError(null);
          return result.data;
        } else if ("errors" in result) {
          setError(result);
          throw new Error(result.errors?.[0]?.message || "Verification failed");
        } else {
          throw new Error("Verification failed");
        }
      },
      prepareVerification: async (params: VerificationParams) => {
        const url = new URL(
          `/auth/prepare-verification`,
          window.location.origin,
        );
        url.searchParams.set(
          "attempt_identifier",
          signinAttempt?.id?.toString() || "",
        );
        url.searchParams.set("strategy", params.strategy);
        url.searchParams.set("identifier_type", "signin");

        if (params.strategy === "phone_otp" && params.lastDigits) {
          url.searchParams.set("last_digits", params.lastDigits);
        } else if (params.strategy === "email_otp" && params.redirectUri) {
          url.searchParams.set("redirect_uri", params.redirectUri);
        } else if (params.strategy === "magic_link" && params.redirectUri) {
          url.searchParams.set("redirect_uri", params.redirectUri);
        }

        const response = await client(url.pathname + url.search, {
          method: "POST",
        });

        return responseMapper(response) as Promise<
          ApiResult<PrepareVerificationResponse>
        >;
      },
      completeProfile: async (data: ProfileCompletionData) => {
        if (!signinAttempt) {
          throw new Error("No signin attempt found");
        }

        const form = new FormData();
        for (const [key, value] of Object.entries(data)) {
          if (value) {
            form.append(key, value);
          }
        }

        const response = await client(
          `/auth/complete-profile?attempt_id=${signinAttempt.id}`,
          {
            method: "POST",
            body: form,
          },
        );

        const result = await responseMapper<Session>(response);
        if ("data" in result && result.data) {
          // Update signin attempt with the latest from the session
          const latestAttempt = result.data.signin_attempts?.find(
            (a) => a.id === signinAttempt.id,
          );
          if (latestAttempt) {
            setSignInAttempt(latestAttempt);
          }
          setError(null);
          return result.data;
        } else {
          throw new Error("Profile completion failed");
        }
      },
    },
    discardSignInAttempt: () => {
      setSignInAttempt(null);
      setError(null);
    },
    setSignInAttempt,
    error,
  };
}

type SignInFunction<T extends SignInStrategy> = {
  [SignInStrategy.Username]: SignInPlainUsername;
  [SignInStrategy.Email]: SignInPlainEmail;
  [SignInStrategy.Phone]: SignInPhone;
  [SignInStrategy.EmailOTP]: SignInEmailOTP;
  [SignInStrategy.MagicLink]: SignInMagicLink;
  [SignInStrategy.Oauth]: SignInOauth;
  [SignInStrategy.Generic]: SignInGeneric;
}[T];

export type UseSignInWithStrategyReturnType<T extends SignInStrategy> =
  | {
      loading: true;
      signIn: never;
      signinAttempt: null;
      discardSignInAttempt: () => void;
      setSignInAttempt: (attempt: SigninAttempt | null) => void;
      error: null;
    }
  | {
      loading: false;
      signIn: {
        create: SignInFunction<T>;
        completeVerification: (verificationCode: string) => Promise<Session>;
        prepareVerification: (
          params: VerificationParams,
        ) => Promise<ApiResult<PrepareVerificationResponse>>;
        completeProfile: (data: ProfileCompletionData) => Promise<Session>;
      };
      signinAttempt: SigninAttempt | null;
      discardSignInAttempt: () => void;
      setSignInAttempt: (attempt: SigninAttempt | null) => void;
      error: ApiResult<unknown, ErrorInterface> | null;
    };

export function useSignInWithStrategy<T extends SignInStrategy>(
  strategy: T,
): UseSignInWithStrategyReturnType<T> {
  const {
    loading,
    signIn,
    signinAttempt,
    discardSignInAttempt,
    setSignInAttempt,
    error,
  } = useSignIn();

  if (loading) {
    return {
      loading: true,
      signIn: null as never,
      signinAttempt: null,
      discardSignInAttempt,
      setSignInAttempt,
      error: null,
    } as UseSignInWithStrategyReturnType<T>;
  }

  const strategyFunction = (() => {
    switch (strategy) {
      case SignInStrategy.Username:
        return signIn.createStrategy(SignInStrategy.Username);
      case SignInStrategy.Email:
        return signIn.createStrategy(SignInStrategy.Email);
      case SignInStrategy.Phone:
        return signIn.createStrategy(SignInStrategy.Phone);
      case SignInStrategy.EmailOTP:
        return signIn.createStrategy(SignInStrategy.EmailOTP);
      case SignInStrategy.MagicLink:
        return signIn.createStrategy(SignInStrategy.MagicLink);
      case SignInStrategy.Oauth:
        return signIn.createStrategy(SignInStrategy.Oauth);
      case SignInStrategy.Generic:
        return signIn.createStrategy(SignInStrategy.Generic);
      default:
        throw new Error("Invalid sign-in strategy");
    }
  })();

  return {
    loading: false,
    signinAttempt,
    signIn: {
      create: strategyFunction,
      completeVerification: signIn.completeVerification,
      prepareVerification: signIn.prepareVerification,
      completeProfile: signIn.completeProfile,
    },
    discardSignInAttempt,
    setSignInAttempt,
    error,
  } as UseSignInWithStrategyReturnType<T>;
}
