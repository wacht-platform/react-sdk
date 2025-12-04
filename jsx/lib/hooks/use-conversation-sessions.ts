import { useClient } from "./use-client";
import { useCallback } from "react";
import useSWR from "swr";
import { responseMapper } from "../utils/response-mapper";

export interface ConversationSession {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'waiting_for_input' | 'interrupted' | 'completed' | 'failed';
  last_activity_at: string;
  context_group?: string;
  created_at: string;
}

export interface CreateSessionRequest {
  title: string;
  system_instructions?: string;
}

export interface ListSessionsOptions {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
}

export interface ListSessionsResponse {
  data: ConversationSession[];
  has_more: boolean;
}

type UseConversationSessionsReturnType = {
  sessions: ConversationSession[];
  loading: boolean;
  error: Error | null;
  createSession: (request: CreateSessionRequest) => Promise<ConversationSession>;
  deleteSession: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
};

export function useConversationSessions(token: string): UseConversationSessionsReturnType {
  const { client } = useClient();

  const fetcher = useCallback(async () => {
    const response = await client(`/api/agent/contexts?token=${encodeURIComponent(token)}`, {
      method: "GET",
    });
    const parsed = await responseMapper<ListSessionsResponse>(response);
    return parsed.data;
  }, [client, token]);

  const { data, error, mutate } = useSWR(
    token ? `wacht-agent-sessions:${token}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const createSession = useCallback(async (request: CreateSessionRequest): Promise<ConversationSession> => {
    const formData = new FormData();
    formData.append('title', request.title);
    if (request.system_instructions) {
      formData.append('system_instructions', request.system_instructions);
    }

    const response = await client(`/api/agent/contexts?token=${encodeURIComponent(token)}`, {
      method: "POST",
      body: formData,
    });

    const parsed = await responseMapper<ConversationSession>(response);

    await mutate((current) => {
      if (!current) return current;
      return {
        ...current,
        data: [parsed.data, ...current.data],
      };
    });

    return parsed.data;
  }, [client, token, mutate]);

  const deleteSession = useCallback(async (id: string): Promise<void> => {
    await client(`/api/agent/contexts/${id}/delete?token=${encodeURIComponent(token)}`, {
      method: "POST",
    });

    await mutate((current) => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.filter((session) => session.id !== id),
      };
    });
  }, [client, token, mutate]);

  return {
    sessions: data?.data || [],
    loading: !data && !error,
    error,
    createSession,
    deleteSession,
    refetch: async () => { await mutate(); },
  };
}