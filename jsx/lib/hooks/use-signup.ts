import { ApiResult, Client } from "@/types";
import { ErrorInterface } from "@/types";
import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import { useState } from "react";
import { Session, SignupAttempt } from "@/types";
import { SignUpParams } from "@/types";

export interface DeploymentInvitationData {
  valid: boolean;
  first_name?: string;
  last_name?: string;
  email?: string;
  message?: string;
  error_code?: string;
}

export type SignUpFunction = {
  create: (params: SignUpParams) => Promise<ApiResult<unknown, ErrorInterface>>;
  prepareVerification: (
    params: SignupVerificationParams,
  ) => Promise<ApiResult<PrepareVerificationResponse>>;
  completeVerification: (verificationCode: string) => Promise<ApiResult<Session>>;
  validateDeploymentInvitation: (token: string) => Promise<DeploymentInvitationData>;
};

export type SignupVerificationStrategy = "email_otp" | "phone_otp";

type SignupEmailOTPVerificationParams = {
  strategy: "email_otp";
  redirectUri?: string;
};

type SignupPhoneOTPVerificationParams = {
  strategy: "phone_otp";
  lastDigits?: string;
};

type SignupVerificationParams =
  | SignupEmailOTPVerificationParams
  | SignupPhoneOTPVerificationParams;

// Response type for prepareVerification
type PrepareVerificationResponse = {
  otp_sent?: boolean;
  masked_phone?: string;
  masked_email?: string;
  verification_method?: string;
};

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
  setErrors: (errors: ApiResult<unknown, ErrorInterface> | null) => void,
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
      const result = await responseMapper<Session>(response);
      if ("data" in result && result.data?.signup_attempts?.length) {
        setSignUpAttempt(result.data.signup_attempts?.at(-1) || null);
        setErrors(null);
      } else {
        setErrors(result);
      }
      return result;
    },
    prepareVerification: async (params: SignupVerificationParams) => {
      const url = new URL(`/auth/prepare-verification`, window.location.origin);
      url.searchParams.set(
        "attempt_identifier",
        signupAttempt?.id?.toString() || "",
      );
      url.searchParams.set("strategy", params.strategy);
      url.searchParams.set("identifier_type", "signup");

      // Handle parameters based on strategy type
      if (params.strategy === "phone_otp" && params.lastDigits) {
        url.searchParams.set("last_digits", params.lastDigits);
      } else if (params.strategy === "email_otp" && params.redirectUri) {
        url.searchParams.set("redirect_uri", params.redirectUri);
      }

      const response = await client(url.pathname + url.search, {
        method: "POST",
      });

      return responseMapper(response) as Promise<
        ApiResult<PrepareVerificationResponse>
      >;
    },
    completeVerification: async (verificationCode: string) => {
      const form = new FormData();
      form.append("verification_code", verificationCode);

      const response = await client(
        `/auth/attempt-verification?attempt_identifier=${signupAttempt?.id}&identifier_type=signup`,
        {
          method: "POST",
          body: form,
        },
      );
      
      const result = await responseMapper<Session>(response);
      if ("data" in result && result.data?.signup_attempts?.length) {
        setSignUpAttempt(result.data.signup_attempts.at(-1) || null);
        setErrors(null);
      } else if ("errors" in result) {
        setErrors(result);
        throw new Error(result.errors?.[0]?.message || "Verification failed");
      }
      return result;
    },
    validateDeploymentInvitation: async (token: string) => {
      try {
        const response = await client(`/deployment/invitations/validate?token=${encodeURIComponent(token)}`, {
          method: "GET",
        });

        const result = await responseMapper<DeploymentInvitationData>(response);

        if ("data" in result && result.data) {
          return result.data;
        } else {
          return {
            valid: false,
            message: "Failed to validate invitation",
            error_code: "VALIDATION_ERROR",
          };
        }
      } catch (err: any) {
        return {
          valid: false,
          message: err.message || "Failed to validate invitation",
          error_code: "NETWORK_ERROR",
        };
      }
    },
  };
}

export function useSignUp(): UseSignUpReturnType {
  const { client, loading } = useClient();
  const [signupAttempt, setSignupAttempt] = useState<SignupAttempt | null>(
    null,
  );
  const [errors, setErrors] = useState<ApiResult<
    unknown,
    ErrorInterface
  > | null>(null);

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
