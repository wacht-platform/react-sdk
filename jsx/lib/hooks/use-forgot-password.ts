import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { useState } from "react";
import { ApiResult, ErrorInterface, Session } from "@/types";

export function useForgotPassword() {
  const { client, loading } = useClient();

  const [error, setError] = useState<Error | null>(null);

  const forgotPassword = async (
    email: string
  ): Promise<ApiResult<{}, ErrorInterface>> => {
    setError(null);

    const form = new FormData();
    form.append("email", email);

    const response = await client("/auth/forgot-password", {
      method: "POST",
      body: form,
    });

    const result = await responseMapper<{}>(response);

    if ("errors" in result && result.errors) {
      setError(new Error(result.errors[0].message));
    }

    return result;
  };

  const verifyOtp = async (
    email: string,
    otp: string
  ): Promise<ApiResult<{ token: string }, ErrorInterface>> => {
    setError(null);

    const form = new FormData();
    form.append("email", email);
    form.append("otp", otp);

    const response = await client("/auth/forgot-password", {
      method: "POST",
      body: form,
    });

    const result = await responseMapper<{ token: string }>(response);

    if ("errors" in result && result.errors) {
      setError(new Error(result.errors[0].message));
    }

    return result;
  };

  const resetPassword = async (
    token: string,
    password: string
  ): Promise<ApiResult<Session, ErrorInterface>> => {
    setError(null);

    const form = new FormData();
    form.append("token", token);
    form.append("password", password);

    const response = await client("/auth/reset-password", {
      method: "POST",
      body: form,
    });

    const result = await responseMapper<Session>(response);

    if ("errors" in result && result.errors) {
      setError(new Error(result.errors[0].message));
    }

    return result;
  };

  return {
    error,
    loading,
    forgotPassword,
    verifyOtp,
    resetPassword,
  };
}
