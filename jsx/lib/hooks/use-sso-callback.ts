import { useState, useEffect } from "react";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type { Session, SigninAttempt } from "@/types";

interface SSOCallbackResult {
  session: Session;
  redirect_uri?: string;
}

interface SSOCallbackState {
  loading: boolean;
  error: Error | null;
  session: Session | null;
  redirectUri: string | null;
  processed: boolean;
  signinAttempt: SigninAttempt | null;
}

/**
 * Headless hook for handling SSO OAuth callback
 * Automatically processes URL parameters and handles the callback flow
 */
export function useSSOCallback(): SSOCallbackState {
  const { client, loading: clientLoading } = useClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);
  const [signinAttempt, setSigninAttempt] = useState<SigninAttempt | null>(
    null,
  );

  useEffect(() => {
    if (processed || clientLoading) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const oauthError = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (!code && !oauthError) {
      setProcessed(true);
      const err = new Error("No OAuth callback data found.");
      setError(err);
      return;
    }

    setProcessed(true);
    setLoading(true);

    if (oauthError) {
      const errorMessage = errorDescription || oauthError;
      const err = new Error(`OAuth Error: ${errorMessage}`);
      setError(err);
      setLoading(false);
      return;
    }

    if (code && state) {
      handleCallback(code, state);
    } else {
      const err = new Error("Missing required OAuth parameters");
      setError(err);
      setLoading(false);
    }
  }, [processed, clientLoading]);

  const handleCallback = async (code: string, state: string) => {
    try {
      // Decode the state to determine if it's sign-in or connect flow
      // State format: base64_data.hmac_signature
      let endpoint: string;
      let method: string;

      try {
        const stateParts = state.split(".");
        if (stateParts.length !== 2) {
          throw new Error("Invalid OAuth state format - missing signature");
        }

        const base64Data = stateParts[0].replace(/-/g, "+").replace(/_/g, "/");
        const padding =
          base64Data.length % 4 ? "=".repeat(4 - (base64Data.length % 4)) : "";
        const decodedBytes = atob(base64Data + padding);
        const stateAction = decodedBytes.split("|")[0];
        if (stateAction === "sign_in") {
          endpoint = `/auth/oauth2/callback`;
          method = "GET";
        } else if (stateAction === "connect_social") {
          endpoint = `/me/sso-connection-callback`;
          method = "POST";
        } else {
          throw new Error(`Unknown OAuth action: ${stateAction}`);
        }
      } catch (e) {
        const error =
          e instanceof Error ? e : new Error("Failed to parse OAuth state");
        setError(
          new Error(
            `Invalid OAuth callback: ${error.message}. The authorization link may be expired or malformed. Please try signing in again.`,
          ),
        );
        setLoading(false);
        return;
      }

      const response = await client(
        `${endpoint}?code=${encodeURIComponent(
          code,
        )}&state=${encodeURIComponent(state)}`,
        {
          method: method,
        },
      );

      const result = await responseMapper<SSOCallbackResult>(response);

      if ("data" in result) {
        const sessionData = result.data.session;
        const redirectUriData = result.data.redirect_uri || null;

        setSession(sessionData);
        setRedirectUri(redirectUriData);

        if (
          sessionData.signin_attempts &&
          sessionData.signin_attempts.length > 0
        ) {
          const attempt = sessionData.signin_attempts.at(-1);
          if (attempt) {
            setSigninAttempt(attempt);
          }
        }
      } else {
        const err = new Error("SSO callback failed");
        setError(err);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    session,
    redirectUri,
    processed,
    signinAttempt,
  };
}
