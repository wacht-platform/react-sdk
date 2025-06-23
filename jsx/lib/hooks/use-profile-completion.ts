import { useEffect, useState } from "react";
import { useSession } from "./use-session";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { ProfileCompletionData } from "../types/profile";

export function useProfileCompletion() {
  const { session, loading: sessionLoading } = useSession();
  const { client } = useClient();

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attemptType, setAttemptType] = useState<"signin" | "signup" | null>(
    null
  );

  useEffect(() => {
    if (!sessionLoading && session) {
      detectLastAttempt();
    }
  }, [session, sessionLoading]);

  const detectLastAttempt = () => {
    if (!session) return;

    // Check for incomplete signin attempts first
    const incompleteSigninAttempt = session.signin_attempts?.find(
      (attempt: any) => attempt.requires_completion && !attempt.completed
    );

    if (incompleteSigninAttempt) {
      setAttempt(incompleteSigninAttempt);
      setAttemptType("signin");
      return;
    }

    // Check for incomplete signup attempts (including OAuth)
    const incompleteSignupAttempt = session.signup_attempts?.find(
      (attempt: any) =>
        attempt.missing_fields?.length > 0 ||
        (attempt.remaining_steps?.length > 0 && !attempt.completed)
    );

    if (incompleteSignupAttempt) {
      setAttempt(incompleteSignupAttempt);
      setAttemptType("signup");
      return;
    }

    // If no incomplete attempts found, show error
    handleNoAttemptFound();
  };

  const handleNoAttemptFound = () => {
    const error = new Error("No incomplete profile completion found");
    setError(error);
  };

  const handleComplete = async (data: ProfileCompletionData) => {
    if (!attempt || !attemptType) {
      throw new Error("No attempt found");
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = `/auth/complete-profile?attempt_id=${attempt.id}`;

      const form = new FormData();
      for (const [key, value] of Object.entries(data)) {
        if (value) {
          form.append(key, value);
        }
      }

      const response = await responseMapper(
        await client(endpoint, {
          method: "POST",
          body: form,
        })
      );

      // Check if completion was successful
      const responseData = response.data as any;
      if (responseData?.session || responseData?.signin_attempt?.completed) {
        return { success: true, data: responseData };
      } else {
        // Still has remaining steps, update attempt
        const updatedAttempt =
          responseData?.signin_attempt || responseData?.signup_attempt;
        if (updatedAttempt) {
          setAttempt(updatedAttempt);
        }
        return { success: false, data: response.data };
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteVerification = async (code: string) => {
    if (!attempt || !attemptType) {
      throw new Error("No attempt found");
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        attemptType === "signin"
          ? `/auth/verify-signin?attempt_id=${attempt.id}`
          : `/auth/verify-signup?attempt_id=${attempt.id}`;

      const form = new FormData();
      form.append("verification_code", code);

      const response = await responseMapper(
        await client(endpoint, {
          method: "POST",
          body: form,
        })
      );

      // Check if verification completed the flow
      const responseData = response.data as any;
      if (responseData?.session || responseData?.signin_attempt?.completed) {
        return { success: true, data: responseData };
      } else {
        // Update attempt with new state
        const updatedAttempt =
          responseData?.signin_attempt || responseData?.signup_attempt;
        if (updatedAttempt) {
          setAttempt(updatedAttempt);
        }
        return { success: true, data: response.data };
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareVerification = async (strategy: string) => {
    if (!attempt || !attemptType) {
      throw new Error("No attempt found");
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        attemptType === "signin"
          ? `/auth/prepare-signin-verification?attempt_id=${attempt.id}`
          : `/auth/prepare-signup-verification?attempt_id=${attempt.id}`;

      const form = new FormData();
      form.append("strategy", strategy);

      await responseMapper(
        await client(endpoint, {
          method: "POST",
          body: form,
        })
      );

      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    attempt,
    attemptType,
    loading: sessionLoading || loading,
    error,
    handleComplete,
    handleCompleteVerification,
    handlePrepareVerification,
  };
}
