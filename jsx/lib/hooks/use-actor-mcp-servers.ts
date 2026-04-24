import { useCallback } from "react";
import useSWR from "swr";
import type { ActorMcpServerSummary } from "@wacht/types";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";

interface ActorMcpServerConnectResponse {
    auth_url: string;
}

export function useActorMcpServers(enabled = true) {
    const { client } = useClient();
    const key = enabled ? "wacht-ai-actor-mcp-servers" : null;

    const fetcher = useCallback(async () => {
        const response = await client(`/ai/mcp-servers`);
        const parsed = await responseMapper<ActorMcpServerSummary[]>(response);
        return parsed.data;
    }, [client]);

    const { data, error, mutate, isLoading } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    const connect = useCallback(
        async (mcpServerId: string) => {
            const response = await client(`/ai/mcp-servers/${mcpServerId}/connect`, {
                method: "POST",
                body: new URLSearchParams(),
            });
            return responseMapper<ActorMcpServerConnectResponse>(response);
        },
        [client],
    );

    const disconnect = useCallback(
        async (mcpServerId: string) => {
            const response = await client(`/ai/mcp-servers/${mcpServerId}/disconnect`, {
                method: "POST",
                body: new URLSearchParams(),
            });
            const parsed = await responseMapper<{ success: boolean }>(response);
            await mutate();
            return parsed;
        },
        [client, mutate],
    );

    return {
        servers: data ?? [],
        loading: isLoading,
        error,
        connect,
        disconnect,
        refetch: async () => {
            await mutate();
        },
    };
}
