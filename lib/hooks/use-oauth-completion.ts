import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { Session } from "@/types/session";
import { useState } from "react";
import { ApiResult, ErrorCode, ErrorInterface } from "@/types/client";

export function useOAuthCompletion(attemptId?: string) {
  const { client, loading } = useClient();
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState<Error | null>(null);

  const completeOAuthSignup = async (data: {
    first_name?: string;
    last_name?: string;
    username?: string;
    phone_number?: string;
  }): Promise<ApiResult<Session, ErrorInterface>> => {
    if (!attemptId) {
      const err = new Error("No signup attempt found");
      setCompletionError(err);
      return {
        data: null as never,
        errors: [
          { message: err.message, code: ErrorCode.OauthCompletionFailed },
        ],
      };
    }

    setCompletionLoading(true);
    setCompletionError(null);

    const formData = new FormData();
    if (data.first_name) formData.append("first_name", data.first_name);
    if (data.last_name) formData.append("last_name", data.last_name);
    if (data.username) formData.append("username", data.username);
    if (data.phone_number) formData.append("phone_number", data.phone_number);

    const response = await client(
      `/auth/oauth2/complete?attempt_id=${attemptId}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await responseMapper<Session>(response);

    setCompletionLoading(false);

    if ("errors" in result && result.errors) {
      setCompletionError(new Error(result.errors[0].message));
    }

    return result;
  };

  return {
    loading: loading || completionLoading,
    completeOAuthSignup,
    error: completionError,
  };
}
