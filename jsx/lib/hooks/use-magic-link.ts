import { useState, useEffect } from "react";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { ApiResult, ErrorInterface } from "@/types";

export interface MagicLinkParams {
  token?: string;
  attempt?: string;
  redirectUri?: string;
}

export interface UseMagicLinkVerificationReturnType {
  loading: boolean;
  verifyMagicLink: (params: MagicLinkParams) => Promise<ApiResult<{}, ErrorInterface>>;
  success: boolean | null;
}

export function useMagicLinkVerification(): UseMagicLinkVerificationReturnType {
  const { client, loading: clientLoading } = useClient();
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);

  const verifyMagicLink = async (params: MagicLinkParams): Promise<ApiResult<{}, ErrorInterface>> => {
    if (!params.token || !params.attempt) {
      throw new Error("Invalid magic link parameters");
    }

    setVerificationLoading(true);
    setVerificationSuccess(null);

    try {
      // Build URL with optional redirect_uri parameter
      const url = new URL(`/auth/verify-magic-link`, window.location.origin);
      url.searchParams.set('token', params.token);
      url.searchParams.set('attempt', params.attempt);
      if (params.redirectUri) {
        url.searchParams.set('redirect_uri', params.redirectUri);
      }

      const response = await client(url.pathname + url.search, {
        method: "GET",
      });

      const result = await responseMapper<{}>(response);

      setVerificationLoading(false);
      setVerificationSuccess(true);

      return result;
    } catch (error) {
      setVerificationLoading(false);
      setVerificationSuccess(false);
      throw error;
    }
  };

  return {
    loading: clientLoading || verificationLoading,
    verifyMagicLink,
    success: verificationSuccess,
  };
}

export function useMagicLinkParams(): MagicLinkParams {
  const [params, setParams] = useState<MagicLinkParams>({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setParams({
      token: urlParams.get('token') || undefined,
      attempt: urlParams.get('attempt') || undefined,
      redirectUri: urlParams.get('redirect_uri') || undefined,
    });
  }, []);

  return params;
}
