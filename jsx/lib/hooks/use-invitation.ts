import { useState, useCallback } from "react";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";

export interface AcceptInvitationResponse {
  organization?: {
    id: string;
    name: string;
  };
  workspace?: {
    id: string;
    name: string;
  };
  signin_id?: string;
  already_member?: boolean;
  message?: string;
  requires_signin?: boolean;
  invited_email?: string;
  error_code?: string;
}

export const useInvitation = () => {
  const { client } = useClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<AcceptInvitationResponse | null>(null);

  const acceptInvitation = useCallback(async (token: string): Promise<AcceptInvitationResponse> => {
    setLoading(true);
    setError(null);
    setInvitationData(null);

    try {
      const formData = new FormData();
      formData.append("token", token);

      const response = await client("/organizations/invitations/accept", {
        method: "POST",
        body: formData,
      });

      const result = await responseMapper<AcceptInvitationResponse>(response);

      const data = result.data;
      setInvitationData(data);

      if (data.error_code) {
        setError(data.message || "Failed to accept invitation");
      }

      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to accept invitation";
      setError(errorMessage);
      const errorData = { error_code: "NETWORK_ERROR", message: errorMessage };
      setInvitationData(errorData);
      return errorData;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const reset = useCallback(() => {
    setError(null);
    setInvitationData(null);
  }, []);

  return {
    acceptInvitation,
    invitationData,
    loading,
    error,
    reset,
  };
};