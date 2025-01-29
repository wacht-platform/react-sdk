import type { ApiResult, Client } from "../types/client";
import { mapResponse } from "../utils/response-mapper";
import { useClient } from "./use-client";
import type { SignUpParams, SSOProvider, SSOResponse } from "../types/auth";
import type { SignInAttempt, Session } from "../types/session";
import { useSignInAttempt } from "./use-signin-attempt";

type SignUpFunction = (params: SignUpParams) => Promise<ApiResult<unknown>>;
type InitSSOFunction = (
  provider: SSOProvider,
) => Promise<ApiResult<SSOResponse>>;

type IdentifierAvailabilityFunction = (
  identifier: string,
  identifierType: "email" | "username",
) => Promise<ApiResult<{ exists: boolean }>>;

type UseSignUpReturnType =
  | {
      loading: true;
      signUp: never;
      initSSO: never;
      identifierAvailability: never;
      signInAttempt: null;
      discardSignInAttempt: () => void;
    }
  | {
      loading: false;
      signUp: SignUpFunction;
      initSSO: InitSSOFunction;
      identifierAvailability: IdentifierAvailabilityFunction;
      signInAttempt: SignInAttempt | null;
      discardSignInAttempt: () => void;
    };

type SignUpResponse = {
  sign_in_attempt?: SignInAttempt;
};

type InitSSOResponseType = {
  oauth_url: string;
  session: Session;
};

function builder(
  client: Client,
  setSignUpAttempt: (attempt: SignInAttempt | null) => void,
): SignUpFunction {
  return async (params: SignUpParams) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(params)) {
      form.append(key, value);
    }
    const response = await client("/auth/signup", {
      method: "POST",
      body: form,
    });
    const result = await mapResponse<SignUpResponse>(response);
    if ("data" in result && result.data?.sign_in_attempt) {
      setSignUpAttempt(result.data.sign_in_attempt);
    }
    return result;
  };
}

function ssoBuilder(client: Client): InitSSOFunction {
  return async (provider: SSOProvider) => {
    const response = await client("/auth/oauth/authorize", {
      method: "POST",
      body: JSON.stringify({ provider }),
    });
    return mapResponse<InitSSOResponseType>(response);
  };
}

function identifierAvailabilityBuilder(
  client: Client,
): IdentifierAvailabilityFunction {
  return async (identifier: string, identifierType: "email" | "username") => {
    const response = await client(
      `/auth/identifier-availability?identifier=${identifier}&type=${identifierType}`,
    );
    return mapResponse(response);
  };
}

export function useSignUp(): UseSignUpReturnType {
  const { client, loading } = useClient();
  const { setSignInAttempt, signInAttempt, discardSignInAttempt } =
    useSignInAttempt();

  if (loading) {
    return {
      loading: true,
      signUp: null as never,
      initSSO: null as never,
      identifierAvailability: null as never,
      signInAttempt: null,
      discardSignInAttempt,
    };
  }

  return {
    loading: false,
    signInAttempt,
    discardSignInAttempt,
    signUp: builder(client, setSignInAttempt),
    initSSO: ssoBuilder(client),
    identifierAvailability: identifierAvailabilityBuilder(client),
  };
}
