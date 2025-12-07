import { useState } from "react";
import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import type { ApiResult, Client } from "@/types";
import type { Session, SigninAttempt, ProfileCompletionData } from "@/types";

// Identifier-First flow types
export interface IdentifyResult {
  strategy: "sso" | "social" | "password";
  connection_id?: string;
  idp_url?: string;
  provider?: string;
}

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
  token?: string;
};

type SignInGeneric = ({
  email,
  username,
  password,
  phone,
  strategy,
  token,
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

type SignInStrategy =
  | "username"
  | "email"
  | "phone"
  | "email_otp"
  | "magic_link"
  | "oauth"
  | "generic";

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
  (strategy: "username"): SignInPlainUsername;
  (strategy: "email"): SignInPlainEmail;
  (strategy: "phone"): SignInPhone;
  (strategy: "email_otp"): SignInEmailOTP;
  (strategy: "magic_link"): SignInMagicLink;
  (strategy: "oauth"): SignInOauth;
  (strategy: "generic"): SignInGeneric;
};

type SignIn = {
  createStrategy: CreateSignInStrategyResult;
  prepareVerification: (
    params: VerificationParams,
  ) => Promise<ApiResult<PrepareVerificationResponse>>;
  completeVerification: (verificationCode: string) => Promise<Session>;
  completeProfile: (data: ProfileCompletionData) => Promise<Session>;
  identify: (identifier: string) => Promise<IdentifyResult>;
  initEnterpriseSso: (connectionId: string, redirectUri?: string) => Promise<{ sso_url: string; session: Session }>;
};

type UseSignInReturnType =
  | {
    loading: false;
    signIn: SignIn;
    signinAttempt: SigninAttempt | null;
    discardSignInAttempt: () => void;
    setSignInAttempt: (attempt: SigninAttempt | null) => void;
  }
  | {
    loading: true;
    signIn: never;
    signinAttempt: null;
    discardSignInAttempt: () => void;
    setSignInAttempt: (attempt: SigninAttempt | null) => void;
  };

type InitSSOResponseType = {
  oauth_url: string;
  session: Session;
};

function builder(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
): CreateSignInStrategyResult {
  const functionMap = {
    ["username"]: builderUsername(client, setSignInAttempt),
    ["email"]: builderEmail(client, setSignInAttempt),
    ["phone"]: builderPhone(client, setSignInAttempt),
    ["email_otp"]: builderEmailOTP(client, setSignInAttempt),
    ["magic_link"]: builderMagicLink(client, setSignInAttempt),
    ["oauth"]: builderOauth(client),
    ["generic"]: builderGeneric(client, setSignInAttempt),
  };

  return function signInBuilder(strategy: SignInStrategy) {
    return functionMap[strategy];
  } as CreateSignInStrategyResult;
}

function builderUsername(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
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
    }
    return result;
  };
}

function builderEmail(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
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
    }
    return result;
  };
}

function builderPhone(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
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
    }
    return result;
  };
}

function builderEmailOTP(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
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
    }
    return result;
  };
}

function builderMagicLink(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
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
    }
    return result;
  };
}

function builderOauth(
  client: Client,
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
      if (result.data.oauth_url) {
        window.location.href = result.data.oauth_url;
      }
    }
    return result;
  };
}

function builderGeneric(
  client: Client,
  setSignInAttempt: (attempt: SigninAttempt | null) => void,
): SignInGeneric {
  return async ({
    email,
    username,
    password,
    phone,
    strategy,
    token,
  }: GenericSignInParams) => {
    const form = new FormData();

    if (strategy) {
      form.append("strategy", strategy);
    }
    if (email) form.append("email", email);
    if (username) form.append("username", username);
    if (password) form.append("password", password);
    if (phone) form.append("phone", phone);
    if (token) form.append("token", token);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await responseMapper<Session>(response);
    if ("data" in result && result.data?.signin_attempts?.length) {
      setSignInAttempt(result.data.signin_attempts.at(-1) || null);
    }
    return result as ApiResult<Session>;
  };
}

export function useSignIn(): UseSignInReturnType {
  const { client, loading } = useClient();
  const [signinAttempt, setSignInAttempt] = useState<SigninAttempt | null>(
    null,
  );

  if (loading) {
    return {
      loading: true,
      signIn: null as never,
      signinAttempt: null,
      discardSignInAttempt: () => {
        setSignInAttempt(null);
      },
      setSignInAttempt,
    } as UseSignInReturnType;
  }

  return {
    loading: false,
    signinAttempt,
    signIn: {
      createStrategy: builder(client, setSignInAttempt),
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
          return result.data;
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
          return result.data;
        } else {
          throw new Error("Profile completion failed");
        }
      },
      // Identifier-First flow methods
      identify: async (identifier: string): Promise<IdentifyResult> => {
        console.log("[identify] Starting with identifier:", identifier);
        const response = await client("/auth/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        });

        console.log("[identify] Response status:", response.status);
        const result = await responseMapper<IdentifyResult>(response);
        console.log("[identify] Mapped result:", result);

        return result.data;
      },
      initEnterpriseSso: async (connectionId: string, redirectUri?: string): Promise<{ sso_url: string; session: Session }> => {
        console.log("[initEnterpriseSso] Starting with connectionId:", connectionId, "redirectUri:", redirectUri);
        const params = new URLSearchParams({ connection_id: connectionId });
        if (redirectUri) {
          params.append("redirect_uri", redirectUri);
        }
        const response = await client(`/auth/sso/login?${params.toString()}`, {
          method: "POST",
        });

        console.log("[initEnterpriseSso] Response status:", response.status);
        const result = await responseMapper<{ sso_url: string; session: Session }>(response);
        console.log("[initEnterpriseSso] Mapped result:", result);

        return result.data;
      },
    },
    discardSignInAttempt: () => {
      setSignInAttempt(null);
    },
    setSignInAttempt,
  };
}

type SignInFunction<T extends SignInStrategy> = {
  ["username"]: SignInPlainUsername;
  ["email"]: SignInPlainEmail;
  ["phone"]: SignInPhone;
  ["email_otp"]: SignInEmailOTP;
  ["magic_link"]: SignInMagicLink;
  ["oauth"]: SignInOauth;
  ["generic"]: SignInGeneric;
}[T];

export type UseSignInWithStrategyReturnType<T extends SignInStrategy> =
  | {
    loading: true;
    signIn: never;
    signinAttempt: null;
    discardSignInAttempt: () => void;
    setSignInAttempt: (attempt: SigninAttempt | null) => void;
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
      identify: (identifier: string) => Promise<IdentifyResult>;
      initEnterpriseSso: (connectionId: string, redirectUri?: string) => Promise<{ sso_url: string; session: Session }>;
    };
    signinAttempt: SigninAttempt | null;
    discardSignInAttempt: () => void;
    setSignInAttempt: (attempt: SigninAttempt | null) => void;
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
  } = useSignIn();

  if (loading) {
    return {
      loading: true,
      signIn: null as never,
      signinAttempt: null,
      discardSignInAttempt,
      setSignInAttempt,
    } as UseSignInWithStrategyReturnType<T>;
  }

  const strategyFunction = (() => {
    switch (strategy) {
      case "username":
        return signIn.createStrategy("username");
      case "email":
        return signIn.createStrategy("email");
      case "phone":
        return signIn.createStrategy("phone");
      case "email_otp":
        return signIn.createStrategy("email_otp");
      case "magic_link":
        return signIn.createStrategy("magic_link");
      case "oauth":
        return signIn.createStrategy("oauth");
      case "generic":
        return signIn.createStrategy("generic");
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
      identify: signIn.identify,
      initEnterpriseSso: signIn.initEnterpriseSso,
    },
    discardSignInAttempt,
    setSignInAttempt,
  } as UseSignInWithStrategyReturnType<T>;
}
