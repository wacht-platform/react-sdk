import { useClient } from "./use-client";
import { useCallback } from "react";
import useSWR from "swr";
import { responseMapper } from "../utils/response-mapper";
import { useAgentConversationContext } from "../context/agent-conversation-provider";
import type { AgentIntegration } from "@wacht/types";

type UseAgentIntegrationsReturnType = {
    integrations: AgentIntegration[];
    loading: boolean;
    error: Error | null;
    addIntegration: (integrationId: string) => Promise<void>;
    removeIntegration: (integrationId: string) => Promise<void>;
    refetch: () => Promise<void>;
};

export function useAgentIntegrations(): UseAgentIntegrationsReturnType {
    const { client } = useClient();
    const { token } = useAgentConversationContext();

    const fetcher = useCallback(async () => {
        if (!token) return [];
        const response = await client(`/api/agent/available-integrations?token=${encodeURIComponent(token)}`, {
            method: "GET",
        });
        const parsed = await responseMapper<AgentIntegration[]>(response);
        return parsed.data;
    }, [client, token]);

    const { data, error, mutate } = useSWR(
        token ? `wacht-agent-integrations:${token}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
        }
    );

    const addIntegration = useCallback(async (integrationId: string): Promise<void> => {
        if (!token) return;
        await client(`/api/agent/integrations/${integrationId}?token=${encodeURIComponent(token)}`, {
            method: "POST",
        });

        await mutate((current) => {
            if (!current) return current;
            return current.map((integration) =>
                integration.id === integrationId
                    ? { ...integration, is_active: true }
                    : integration
            );
        });
    }, [client, token, mutate]);

    const removeIntegration = useCallback(async (integrationId: string): Promise<void> => {
        if (!token) return;
        await client(`/api/agent/integrations/${integrationId}?token=${encodeURIComponent(token)}`, {
            method: "DELETE",
        });

        await mutate((current) => {
            if (!current) return current;
            return current.map((integration) =>
                integration.id === integrationId
                    ? { ...integration, is_active: false }
                    : integration
            );
        });
    }, [client, token, mutate]);

    return {
        integrations: data || [],
        loading: !data && !error && !!token,
        error,
        addIntegration,
        removeIntegration,
        refetch: async () => { await mutate(); },
    };
}
