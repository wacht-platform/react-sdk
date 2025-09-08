import { useClient } from "./use-client";
import { useCallback } from "react";
import useSWR from "swr";
import { responseMapper } from "../utils/response-mapper";

export interface ExecutionContext {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'waiting_for_input' | 'interrupted' | 'completed' | 'failed';
  last_activity_at: string;
  context_group?: string;
  created_at: string;
}

export interface CreateContextRequest {
  title: string;
}

export interface ListContextsOptions {
  limit?: number;
  offset?: number;
  status?: string;
}

export interface ListContextsResponse {
  data: ExecutionContext[];
  has_more: boolean;
}

type UseContextManagerReturnType = {
  contexts: ExecutionContext[];
  loading: boolean;
  error: Error | null;
  createContext: (request: CreateContextRequest) => Promise<ExecutionContext>;
  deleteContext: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
};

export function useContextManager(token: string): UseContextManagerReturnType {
  const { client } = useClient();

  const fetcher = useCallback(async () => {
    const response = await client(`/api/agent/contexts?token=${encodeURIComponent(token)}`, {
      method: "GET",
    });
    const parsed = await responseMapper<ListContextsResponse>(response);
    return parsed.data;
  }, [client, token]);

  const { data, error, mutate } = useSWR(
    token ? `contexts-${token}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const createContext = useCallback(async (request: CreateContextRequest): Promise<ExecutionContext> => {
    const formData = new FormData();
    formData.append('title', request.title);
    
    const response = await client(`/api/agent/contexts?token=${encodeURIComponent(token)}`, {
      method: "POST",
      body: formData,
    });
    
    const parsed = await responseMapper<ExecutionContext>(response);
    
    await mutate((current) => {
      if (!current) return current;
      return {
        ...current,
        data: [parsed.data, ...current.data],
      };
    });
    
    return parsed.data;
  }, [client, token, mutate]);

  const deleteContext = useCallback(async (id: string): Promise<void> => {
    await client(`/api/agent/contexts/${id}/delete?token=${encodeURIComponent(token)}`, {
      method: "POST",
    });
    
    await mutate((current) => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.filter((ctx) => ctx.id !== id),
      };
    });
  }, [client, token, mutate]);

  return {
    contexts: data?.data || [],
    loading: !data && !error,
    error,
    createContext,
    deleteContext,
    refetch: async () => { await mutate(); },
  };
}