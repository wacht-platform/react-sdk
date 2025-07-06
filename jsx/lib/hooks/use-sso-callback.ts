import { useState, useEffect } from "react";
import { useClient } from "./use-client";
import { useDeployment } from "./use-deployment";
import { responseMapper } from "../utils/response-mapper";
import type { Session } from "@/types/session";
import { ApiResult, ErrorInterface } from "@/types/client";

interface SSOCallbackResult {
  session: Session;
  redirect_uri?: string;
  signup_attempt?: any;
  signin_attempt?: any;
}

interface OAuthCompletionData {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
}

interface SSOCallbackState {
  loading: boolean;
  error: Error | null;
  session: Session | null;
  redirectUri: string | null;
  processed: boolean;
  signupAttempt: any | null;
  signinAttempt: any | null;
  requiresCompletion: boolean;
  requiresVerification: boolean;
  requires2FA: boolean;
  completeOAuthSignup: (data: OAuthCompletionData) => Promise<boolean>;
  completeVerification: (code: string) => Promise<boolean>;
  prepareVerification: (strategy: string) => Promise<boolean>;
  completionLoading: boolean;
  completionError: Error | null;
}

interface SSOCallbackOptions {
  onSuccess?: (session: Session, redirectUri?: string) => void;
  onError?: (error: Error) => void;
  onRequiresCompletion?: (signupAttempt: any, session: Session) => void;
  autoRedirect?: boolean;
}

/**
 * Headless hook for handling SSO OAuth callback
 * Automatically processes URL parameters and handles the callback flow
 */
export function useSSOCallback(
  options: SSOCallbackOptions = {}
): SSOCallbackState {
  const {
    onSuccess,
    onError,
    onRequiresCompletion,
    autoRedirect = true,
  } = options;
  const { client, loading: clientLoading } = useClient();
  const { deployment } = useDeployment();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);
  const [signupAttempt, setSignupAttempt] = useState<any | null>(null);
  const [signinAttempt, setSigninAttempt] = useState<any | null>(null);
  const [requiresCompletion, setRequiresCompletion] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState<Error | null>(null);

  useEffect(() => {
    if (processed || clientLoading) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const oauthError = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (!code && !oauthError) {
      setProcessed(true);
      const err = new Error(
        "No OAuth callback data found. Redirecting to login."
      );
      setError(err);
      if (onError) onError(err);

      setTimeout(() => {
        const loginUrl =
          deployment?.ui_settings?.sign_in_page_url ||
          deployment?.frontend_host ||
          "/";
        window.location.href = loginUrl;
      }, 2000);
      return;
    }

    setProcessed(true);
    setLoading(true);

    if (oauthError) {
      const errorMessage = errorDescription || oauthError;
      const err = new Error(`OAuth Error: ${errorMessage}`);
      setError(err);
      setLoading(false);
      if (onError) onError(err);
      return;
    }

    if (code && state) {
      handleCallback(code, state);
    } else {
      const err = new Error("Missing required OAuth parameters");
      setError(err);
      setLoading(false);
      if (onError) onError(err);
    }
  }, [processed, clientLoading, onError]);

  const handleCallback = async (code: string, state: string) => {
    try {
      const response = await client(
        `/auth/oauth2/callback?code=${encodeURIComponent(
          code
        )}&state=${encodeURIComponent(state)}`,
        {
          method: "GET",
        }
      );

      const result = await responseMapper<SSOCallbackResult>(response);

      if ("data" in result) {
        const sessionData = result.data.session;
        const redirectUriData = result.data.redirect_uri || null;
        const signupAttemptData = result.data.signup_attempt || null;
        const signinAttemptData = result.data.signin_attempt || null;

        setSession(sessionData);
        setRedirectUri(redirectUriData);

        // Check for signin attempt that requires 2FA
        if (signinAttemptData && sessionData.signin_attempts) {
          const attempt = sessionData.signin_attempts.find(
            (a: any) => a.id === signinAttemptData.id
          );
          
          if (attempt && 
              attempt.current_step === "verify_second_factor" && 
              !attempt.completed &&
              attempt.second_method_authentication_required) {
            setSigninAttempt(attempt);
            setRequires2FA(true);
            
            // Don't trigger onSuccess yet, need 2FA
            return;
          }
        }

        if (signupAttemptData) {
          setSignupAttempt(signupAttemptData);
          setRequiresCompletion(true);

          if (onRequiresCompletion) {
            onRequiresCompletion(signupAttemptData, sessionData);
          }
        } else {
          if (onSuccess) {
            onSuccess(sessionData, redirectUriData || undefined);
          }
        }
      } else {
        const err = new Error("SSO callback failed");
        setError(err);
        if (onError) onError(err);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  const completeOAuthSignup = async (
    data: OAuthCompletionData
  ): Promise<boolean> => {
    if (!signupAttempt) {
      setCompletionError(new Error("No signup attempt found"));
      return false;
    }

    setCompletionLoading(true);
    setCompletionError(null);

    try {
      const formData = new FormData();
      if (data.first_name) formData.append("first_name", data.first_name);
      if (data.last_name) formData.append("last_name", data.last_name);
      if (data.username) formData.append("username", data.username);
      if (data.phone_number) formData.append("phone_number", data.phone_number);

      const response = await client(
        `/auth/oauth2/complete?attempt_id=${signupAttempt.id}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result: ApiResult<SSOCallbackResult, ErrorInterface> =
        await responseMapper<SSOCallbackResult>(response);

      if (!result?.errors?.length) {
        const sessionData = result.data.session;
        const signupAttemptData = result.data.signup_attempt;

        setSession(sessionData);

        if (signupAttemptData) {
          setSignupAttempt(signupAttemptData);

          if (
            signupAttemptData.current_step === "verify_phone" ||
            signupAttemptData.current_step === "verify_email"
          ) {
            setRequiresVerification(true);
            setRequiresCompletion(false);
          } else {
            setRequiresCompletion(true);
            setRequiresVerification(false);
          }
        } else {
          setSignupAttempt(null);
          setRequiresCompletion(false);
          setRequiresVerification(false);

          if (onSuccess) {
            onSuccess(sessionData, redirectUri || undefined);
          }
        }

        setCompletionLoading(false);
        return true;
      } else {
        if ("errors" in result && result.errors && result.errors.length > 0) {
          setCompletionError(new Error(result.errors[0].message));
        } else {
          setCompletionError(new Error("OAuth completion failed"));
        }
        setCompletionLoading(false);
        return false;
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setCompletionError(error);
      setCompletionLoading(false);
      return false;
    }
  };

  const completeVerification = async (code: string): Promise<boolean> => {
    if (!signupAttempt) {
      setCompletionError(new Error("No signup attempt found"));
      return false;
    }

    setCompletionLoading(true);
    setCompletionError(null);

    try {
      const form = new FormData();
      form.append("verification_code", code);

      const response = await client(
        `/auth/attempt-verification?attempt_identifier=${signupAttempt.id}&identifier_type=signup`,
        {
          method: "POST",
          body: form,
        }
      );

      const result = await responseMapper<SSOCallbackResult>(response);

      if ("data" in result) {
        const sessionData = result.data.session;
        setSession(sessionData);
        setSignupAttempt(null);
        setRequiresVerification(false);
        setRequiresCompletion(false);

        if (onSuccess) {
          onSuccess(sessionData, redirectUri || undefined);
        }

        setCompletionLoading(false);
        return true;
      } else {
        const err = new Error("Verification failed");
        setCompletionError(err);
        setCompletionLoading(false);
        return false;
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setCompletionError(error);
      setCompletionLoading(false);
      return false;
    }
  };

  const prepareVerification = async (strategy: string): Promise<boolean> => {
    if (!signupAttempt) {
      setCompletionError(new Error("No signup attempt found"));
      return false;
    }

    try {
      const response = await client(
        `/auth/prepare-verification?attempt_identifier=${signupAttempt.id}&identifier_type=signup&strategy=${strategy}`,
        {
          method: "POST",
        }
      );

      const result = await responseMapper<any>(response);
      return "data" in result;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setCompletionError(error);
      return false;
    }
  };

  useEffect(() => {
    if (
      !autoRedirect ||
      !session ||
      !processed ||
      loading ||
      requiresCompletion ||
      requiresVerification ||
      requires2FA
    )
      return;

    let finalRedirectUrl = redirectUri;

    if (!finalRedirectUrl) {
      finalRedirectUrl =
        deployment?.ui_settings?.sign_in_page_url || deployment!.frontend_host;
    }

    if (finalRedirectUrl) {
      window.location.href = finalRedirectUrl;
    }
  }, [
    autoRedirect,
    session,
    processed,
    loading,
    redirectUri,
    deployment,
    requiresCompletion,
    requiresVerification,
    requires2FA,
  ]);

  return {
    loading,
    error,
    session,
    redirectUri,
    processed,
    signupAttempt,
    signinAttempt,
    requiresCompletion,
    requiresVerification,
    requires2FA,
    completeOAuthSignup,
    completeVerification,
    prepareVerification,
    completionLoading,
    completionError,
  };
}

/**
 * Helper hook that provides a redirect function for manual control
 */
export function useSSORedirect() {
  const { deployment } = useDeployment();

  const redirect = (customRedirectUri?: string) => {
    let finalRedirectUrl = customRedirectUri;

    if (!finalRedirectUrl) {
      finalRedirectUrl =
        deployment?.ui_settings?.sign_in_page_url ||
        deployment?.frontend_host ||
        "/";
    }

    if (deployment?.mode === "staging" && finalRedirectUrl) {
      try {
        const url = new URL(finalRedirectUrl);
        const devSession = localStorage.getItem("__dev_session__");
        if (devSession) {
          url.searchParams.set("dev_session", devSession);
        }
        finalRedirectUrl = url.toString();
      } catch {}
    }

    if (finalRedirectUrl) {
      window.location.href = finalRedirectUrl;
    }
  };

  return { redirect };
}
