import type { ApiResult, Client } from "../types/client";
import type { Session, SignInAttempt } from "../types/session";
import { mapResponse } from "../utils/response-mapper";
import { useClient } from "./use-client";
import { useSignInAttempt } from "./use-signin-attempt";

type UsernameSignInParams = {
  username: string;
  password: string;
};

type SignInPlainUsername = ({
  username,
  password,
}: UsernameSignInParams) => Promise<ApiResult<unknown>>;

type EmailSignInParams = {
  email: string;
  password: string;
};

type SignInPlainEmail = ({
  email,
  password,
}: EmailSignInParams) => Promise<ApiResult<unknown>>;

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
}: GenericSignInParams) => Promise<ApiResult<Session>>;

type PhoneSignInParams = {
  phone: string;
};

type SignInPhone = ({
  phone,
}: PhoneSignInParams) => Promise<ApiResult<unknown>>;

export enum OAuthProvider {
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
}) => Promise<ApiResult<unknown>>;

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
      loading: false;
      signIn: SignIn;
      signInAttempt: SignInAttempt | null;
      discardSignInAttempt: () => void;
    }
  | {
      loading: true;
      signIn: never;
      signInAttempt: null;
      discardSignInAttempt: () => void;
    };

type InitSSOResponseType = {
  oauth_url: string;
  session: Session;
};

function builder(
  client: Client,
  setSignInAttempt: (attempt: SignInAttempt | null) => void,
): CreateSignInStrategyResult {
  const functionMap = {
    [SignInStrategy.Username]: builderUsername(client, setSignInAttempt),
    [SignInStrategy.Email]: builderEmail(client, setSignInAttempt),
    [SignInStrategy.Phone]: builderPhone(client, setSignInAttempt),
    [SignInStrategy.Oauth]: builderOauth(client),
    [SignInStrategy.Generic]: builderGeneric(client, setSignInAttempt),
  };

  return function signInBuilder(strategy: SignInStrategy) {
    return functionMap[strategy];
  } as CreateSignInStrategyResult;
}

function builderUsername(
  client: Client,
  setSignInAttempt: (attempt: SignInAttempt | null) => void,
): SignInPlainUsername {
  return async ({ username, password }: UsernameSignInParams) => {
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await mapResponse<Session>(response);
    if ("data" in result && result.data?.sign_in_attempts?.length) {
      setSignInAttempt(result.data.sign_in_attempts[0]);
    }
    return result;
  };
}

function builderEmail(
  client: Client,
  setSignInAttempt: (attempt: SignInAttempt | null) => void,
): SignInPlainEmail {
  return async ({ email, password }: EmailSignInParams) => {
    const form = new FormData();
    form.append("email", email);
    form.append("password", password);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await mapResponse<Session>(response);
    if ("data" in result && result.data?.sign_in_attempts?.length) {
      setSignInAttempt(result.data.sign_in_attempts[0]);
    }
    return result;
  };
}

function builderPhone(
  client: Client,
  setSignInAttempt: (attempt: SignInAttempt | null) => void,
): SignInPhone {
  return async ({ phone }: PhoneSignInParams) => {
    const form = new FormData();
    form.append("phone", phone);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await mapResponse<Session>(response);
    if ("data" in result && result.data?.sign_in_attempts?.length) {
      setSignInAttempt(result.data.sign_in_attempts[0]);
    }
    return result;
  };
}

function builderOauth(client: Client): SignInOauth {
  return async ({ provider }: { provider: OAuthProvider }) => {
    const response = await client("/auth/oauth/authorize", {
      method: "POST",
      body: JSON.stringify({
        provider,
      }),
    });
    return mapResponse<InitSSOResponseType>(response);
  };
}

function builderGeneric(
  client: Client,
  setSignInAttempt: (attempt: SignInAttempt | null) => void,
): SignInGeneric {
  return async ({ email, username, password, phone }: GenericSignInParams) => {
    const form = new FormData();
    form.append("strategy", "generic");
    if (email) form.append("email", email);
    if (username) form.append("username", username);
    if (password) form.append("password", password);
    if (phone) form.append("phone", phone);

    const response = await client("/auth/signin", {
      method: "POST",
      body: form,
    });
    const result = await mapResponse<Session>(response);
    if ("data" in result && result.data?.sign_in_attempts?.length) {
      setSignInAttempt(result.data.sign_in_attempts[0]);
    }
    return result as ApiResult<Session>;
  };
}

export function useSignIn(): UseSignInReturnType {
  const { client, loading } = useClient();
  const { setSignInAttempt, signInAttempt, discardSignInAttempt } =
    useSignInAttempt();

  if (loading) {
    return {
      loading: true,
      signInAttempt: null,
    } as UseSignInReturnType;
  }

  return {
    loading: false,
    signInAttempt,
    signIn: {
      createStrategy: builder(client, setSignInAttempt),
      completeVerification: async (verificationCode: string) => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");

        await client(
          `/auth/complete-verification?sign_in_attempt=${signInAttempt?.id}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              verification_code: verificationCode,
            }),
          },
        );
      },
      prepareVerification: async (strategy: VerificationStrategy) => {
        await client(
          `/auth/prepare-verification?sign_in_attempt=${signInAttempt?.id}&strategy=${strategy}`,
          {
            method: "POST",
          },
        );
      },
    },
    discardSignInAttempt,
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
      loading: true;
      signIn: never;
      signInAttempt: null;
      discardSignInAttempt: () => void;
    }
  | {
      loading: false;
      signIn: {
        create: SignInFunction<T>;
        completeVerification: (verificationCode: string) => Promise<unknown>;
        prepareVerification: (
          verification: VerificationStrategy,
        ) => Promise<unknown>;
      };
      signInAttempt: SignInAttempt | null;
      discardSignInAttempt: () => void;
    };

export function useSignInWithStrategy<T extends SignInStrategy>(
  strategy: T,
): UseSignInWithStrategyReturnType<T> {
  const { loading, signIn, signInAttempt, discardSignInAttempt } = useSignIn();

  if (loading) {
    return {
      loading: true,
      signInAttempt: null,
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
    signInAttempt,
    signIn: {
      create: strategyFunction,
      completeVerification: signIn.completeVerification,
      prepareVerification: signIn.prepareVerification,
    },
    discardSignInAttempt: discardSignInAttempt,
  } as UseSignInWithStrategyReturnType<T>;
}
