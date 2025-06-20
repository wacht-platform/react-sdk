import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { useState } from "react";
import { ApiResult, ErrorInterface } from "@/types/client";

export function useForgotPassword() {
  const { client, loading } = useClient();
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<Error | null>(
    null
  );

  const forgotPassword = async (
    email: string
  ): Promise<ApiResult<{}, ErrorInterface>> => {
    setForgotPasswordLoading(true);
    setForgotPasswordError(null);

    const form = new FormData();
    form.append("email", email);

    const response = await client("/auth/forgot-password", {
      method: "POST",
      body: form,
    });

    const result = await responseMapper<{}>(response);

    setForgotPasswordLoading(false);

    if ("errors" in result && result.errors) {
      setForgotPasswordError(new Error(result.errors[0].message));
    }

    return result;
  };

  return {
    loading: loading || forgotPasswordLoading,
    forgotPassword,
    error: forgotPasswordError,
  };
}

export function useResetPassword() {
  const { client, loading } = useClient();
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<Error | null>(
    null
  );

  const resetPassword = async (
    email: string,
    otp: string,
    password: string
  ): Promise<ApiResult<{}, ErrorInterface>> => {
    setResetPasswordLoading(true);
    setResetPasswordError(null);

    const form = new FormData();
    form.append("email", email);
    form.append("otp", otp);
    form.append("password", password);

    const response = await client("/auth/reset-password", {
      method: "POST",
      body: form,
    });

    const result = await responseMapper<{}>(response);

    setResetPasswordLoading(false);

    if ("errors" in result && result.errors) {
      setResetPasswordError(new Error(result.errors[0].message));
    }

    return result;
  };

  return {
    loading: loading || resetPasswordLoading,
    resetPassword,
    error: resetPasswordError,
  };
}
