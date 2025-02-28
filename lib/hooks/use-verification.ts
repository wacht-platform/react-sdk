import { useState } from "react";
import { useClient } from "./use-client";

type VerifyOTPParams = {
  otp: string;
  email: string;
};

type UseVerifyEmailOTPReturnType =
  | {
    isLoaded: false;
    verifyOTP: never;
    verificationError: null;
    verificationSuccess: null;
  }
  | {
    isLoaded: true;
    verifyOTP: (params: VerifyOTPParams) => Promise<ApiResult<unknown>>;
    verificationError: string | null;
    verificationSuccess: boolean | null;
  };

export function useVerifyEmailOTP(): UseVerifyEmailOTPReturnType {
  const { client, loading } = useClient();
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);

  if (loading) {
    return {
      isLoaded: false,
      verifyOTP: undefined as never,
      verificationError: null,
      verificationSuccess: null,
    };
  }

  const verifyOTP = async ({ otp, email }: VerifyOTPParams) => {
    setVerificationError(null);
    setVerificationSuccess(null);

    try {
      const response = await client("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          otp,
          email,
        }),
      });

      const result = await response.json();

      if (result?.success) {
        setVerificationSuccess(true);
      } else {
        setVerificationError(result?.message || "Verification failed.");
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        setVerificationError(error.message || "Something went wrong.");
      } else {
        setVerificationError("Something went wrong.");
      }
      return { success: false, message: "An error occurred during OTP verification." };
    }
  };

  return {
    isLoaded: !loading,
    verifyOTP,
    verificationError,
    verificationSuccess,
  };
}
