import { useState } from "react";
import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import type { ApiResult, Client } from "@/types";
import type { Session, SigninAttempt, ProfileCompletionData } from "@/types";

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

type SignInPasskey = () => Promise<ApiResult<Session>>;

type SignInStrategy =
  | "username"
  | "email"
  | "phone"
  | "email_otp"
  | "magic_link"
  | "oauth"
  | "passkey"
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
  (strategy: "passkey"): SignInPasskey;
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
    ["passkey"]: builderPasskey(client),
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

// WebAuthn helpers for passkey sign-in
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function builderPasskey(client: Client): SignInPasskey {
  return async () => {
    // Begin passkey login
    const beginResponse = await client("/auth/passkey/login/begin", {
      method: "POST",
    });
    const beginResult = await responseMapper<{
      options: {
        publicKey: {
          challenge: string;
          timeout?: number;
          rpId?: string;
          userVerification?: string;
          allowCredentials?: { type: string; id: string; transports?: string[] }[];
        }
      }
    }>(beginResponse);

    if (!("data" in beginResult)) {
      return beginResult;
    }

    const publicKey = beginResult.data.options.publicKey;

    // Convert options for WebAuthn API
    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge: base64urlToBuffer(publicKey.challenge),
      timeout: publicKey.timeout,
      rpId: publicKey.rpId,
      userVerification: publicKey.userVerification as UserVerificationRequirement,
      allowCredentials: publicKey.allowCredentials?.map((cred) => ({
        type: cred.type as PublicKeyCredentialType,
        id: base64urlToBuffer(cred.id),
        transports: cred.transports as AuthenticatorTransport[],
      })),
    };

    // Prompt browser for passkey
    let credential: PublicKeyCredential;
    try {
      const result = await navigator.credentials.get({
        publicKey: requestOptions,
      }) as PublicKeyCredential;

      if (!result) {
        throw new Error("Failed to get credential");
      }
      credential = result;
    } catch (error: any) {
      // Handle common WebAuthn errors with friendlier messages
      if (error.name === "NotAllowedError") {
        throw new Error("No passkey found on this device. Please try a different sign-in method.");
      }
      if (error.name === "AbortError") {
        throw new Error("Passkey sign-in was cancelled.");
      }
      throw error;
    }

    // Build assertion data
    const assertionResponse = credential.response as AuthenticatorAssertionResponse;

    // Build form data for finish request
    const formData = new FormData();
    formData.append("id", credential.id);
    formData.append("rawId", bufferToBase64url(credential.rawId));
    formData.append("type", credential.type);
    formData.append("clientDataJSON", bufferToBase64url(assertionResponse.clientDataJSON));
    formData.append("authenticatorData", bufferToBase64url(assertionResponse.authenticatorData));
    formData.append("signature", bufferToBase64url(assertionResponse.signature));
    if (assertionResponse.userHandle) {
      formData.append("userHandle", bufferToBase64url(assertionResponse.userHandle));
    }

    // Finish passkey login
    const finishResponse = await client("/auth/passkey/login/finish", {
      method: "POST",
      body: formData,
    });
    return responseMapper<Session>(finishResponse);
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
        const form = new FormData();
        form.append("identifier", identifier);

        const response = await client("/auth/identify", {
          method: "POST",
          body: form,
        });

        const result = await responseMapper<IdentifyResult>(response);
        return result.data;
      },
      initEnterpriseSso: async (connectionId: string, redirectUri?: string): Promise<{ sso_url: string; session: Session }> => {
        const params = new URLSearchParams({ connection_id: connectionId });
        if (redirectUri) {
          params.append("redirect_uri", redirectUri);
        }
        const response = await client(`/auth/sso/login?${params.toString()}`, {
          method: "POST",
        });

        const result = await responseMapper<{ sso_url: string; session: Session }>(response);
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
  ["passkey"]: SignInPasskey;
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
      case "passkey":
        return signIn.createStrategy("passkey");
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
