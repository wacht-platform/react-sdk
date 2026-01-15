import { useClient } from "./use-client";
import { useCallback } from "react";
import useSWR from "swr";
import { responseMapper } from "../utils/response-mapper";
import type { AgentContext, CreateContextRequest, ListContextsOptions, ListContextsResponse } from "@wacht/types";

type UseAgentContextsReturnType = {
    contexts: AgentContext[];
    loading: boolean;
    error: Error | null;
    hasMore: boolean;
    createContext: (request: CreateContextRequest) => Promise<AgentContext>;
    deleteContext: (id: string) => Promise<void>;
    updateContext: (id: string, updates: { title?: string }) => Promise<void>;
    refetch: () => Promise<void>;
};

export function useAgentContexts(
    options: ListContextsOptions = {}
): UseAgentContextsReturnType {
    const { client } = useClient();
    const { limit = 20, offset = 0, status, search } = options;

    const fetcher = useCallback(async () => {
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
        });
        if (status) params.append("status", status);
        if (search) params.append("search", search);

        const response = await client(`/api/agent/contexts?${params.toString()}`, {
            method: "GET",
        });
        const parsed = await responseMapper<ListContextsResponse>(response);
        return parsed.data;
    }, [client, limit, offset, status, search]);

    const { data, error, mutate } = useSWR(
        `wacht-agent-contexts:${limit}:${offset}:${status}:${search}`,
        fetcher,
        { revalidateOnFocus: false }
    );

    const createContext = useCallback(async (request: CreateContextRequest): Promise<AgentContext> => {
        const formData = new FormData();
        formData.append("title", request.title);
        if (request.system_instructions) {
            formData.append("system_instructions", request.system_instructions);
        }

        const response = await client("/api/agent/contexts", {
            method: "POST",
            body: formData,
        });

        const parsed = await responseMapper<AgentContext>(response);

        await mutate((current) => {
            if (!current) return current;
            return {
                ...current,
                data: [parsed.data, ...current.data],
            };
        });

        return parsed.data;
    }, [client, mutate]);

    const deleteContext = useCallback(async (id: string): Promise<void> => {
        await client(`/api/agent/contexts/${id}/delete`, {
            method: "POST",
        });

        await mutate((current) => {
            if (!current) return current;
            return {
                ...current,
                data: current.data.filter((ctx) => ctx.id !== id),
            };
        });
    }, [client, mutate]);

    const updateContext = useCallback(async (id: string, updates: { title?: string }): Promise<void> => {
        const formData = new FormData();
        if (updates.title) {
            formData.append("title", updates.title);
        }

        const response = await client(`/api/agent/contexts/${id}/update`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to update context");
        }

        await mutate((current) => {
            if (!current) return current;
            return {
                ...current,
                data: current.data.map((ctx) =>
                    ctx.id === id ? { ...ctx, ...updates } : ctx
                ),
            };
        });
    }, [client, mutate]);

    return {
        contexts: data?.data || [],
        loading: !data && !error,
        error,
        hasMore: data?.has_more || false,
        createContext,
        deleteContext,
        updateContext,
        refetch: async () => { await mutate(); },
    };
}
