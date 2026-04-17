import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { ApiResult, Session } from "@/types";

export function useForgotPassword() {
  const { client, loading } = useClient();

  const forgotPassword = async (
    email: string
  ): Promise<ApiResult<{}>> => {
    const form = new FormData();
    form.append("email", email);

    const response = await client("/auth/forgot-password", {
      method: "POST",
      body: form,
    });

    return await responseMapper<{}>(response);
  };

  const verifyOtp = async (
    email: string,
    otp: string
  ): Promise<ApiResult<{ token: string }>> => {
    const form = new FormData();
    form.append("email", email);
    form.append("otp", otp);

    const response = await client("/auth/forgot-password", {
      method: "POST",
      body: form,
    });

    return await responseMapper<{ token: string }>(response);
  };

  const resetPassword = async (
    token: string,
    password: string
  ): Promise<ApiResult<Session>> => {
    const form = new FormData();
    form.append("token", token);
    form.append("password", password);

    const response = await client("/auth/reset-password", {
      method: "POST",
      body: form,
    });

    return await responseMapper<Session>(response);
  };

  return {
    loading,
    forgotPassword,
    verifyOtp,
    resetPassword,
  };
}
