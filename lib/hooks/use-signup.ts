import type { ApiResult, Client, ErrorInterface } from "../types/client";
import { mapResponse } from "../utils/response-mapper";
import { useClient } from "./use-client";
import type { SignUpParams } from "../types/auth";
import type { Session, SignupAttempt } from "../types/session";
import { useState } from "react";

export type SignUpFunction = {
  create: (params: SignUpParams) => Promise<ApiResult<unknown, ErrorInterface>>;
  prepareVerification: (
    strategy: SignupVerificationStrategy
  ) => Promise<unknown>;
  completeVerification: (verificationCode: string) => Promise<unknown>;
};

export type SignupVerificationStrategy = "email_otp" | "phone_otp";

export type UseSignUpReturnType =
  | {
      loading: true;
      signUp: never;
      signupAttempt: null;
      discardSignupAttempt: () => void;
      errors: null;
    }
  | {
      loading: false;
      signUp: SignUpFunction;
      signupAttempt: SignupAttempt | null;
      discardSignupAttempt: () => void;
      errors: ApiResult<unknown, ErrorInterface> | null;
    };

function builder(
  client: Client,
  signupAttempt: SignupAttempt | null,
  setSignUpAttempt: (attempt: SignupAttempt | null) => void,
  setErrors: (errors: ApiResult<unknown, ErrorInterface> | null) => void
): SignUpFunction {
  return {
    create: async (params: SignUpParams) => {
      const form = new FormData();
      for (const [key, value] of Object.entries(params)) {
        form.append(key, value);
      }
      const response = await client("/auth/signup", {
        method: "POST",
        body: form,
      });
      const result = await mapResponse<Session>(response);
      if ("data" in result && result.data?.signup_attempts?.length) {
        setSignUpAttempt(result.data.signup_attempts?.at(-1) || null);
        setErrors(null);
      } else {
        setErrors(result);
      }
      return result;
    },
    prepareVerification: async (strategy: SignupVerificationStrategy) => {
      await client(
        `/auth/prepare-verification?attempt_identifier=${signupAttempt?.id}&strategy=${strategy}&identifier_type=signup`,
        {
          method: "POST",
        }
      );
    },
    completeVerification: async (verificationCode: string) => {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      await client(
        `/auth/attempt-verification?attempt_identifier=${signupAttempt?.id}&identifier_type=signup`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            verification_code: verificationCode,
          }),
        }
      );
    },
  };
}

export function useSignUp(): UseSignUpReturnType {
  const { client, loading } = useClient();
  const [signupAttempt, setSignupAttempt] = useState<SignupAttempt | null>(null);
  const [errors, setErrors] = useState<ApiResult<unknown, ErrorInterface> | null>(null);

  if (loading) {
    return {
      loading: true,
      signUp: null as never,
      signupAttempt: null,
      discardSignupAttempt: () => {
        setSignupAttempt(null);
        setErrors(null);
      },
      errors: null,
    };
  }

  return {
    loading: false,
    signupAttempt,
    discardSignupAttempt: () => {
      setSignupAttempt(null);
      setErrors(null);
    },
    signUp: builder(client, signupAttempt, setSignupAttempt, setErrors),
    errors,
  };
}
