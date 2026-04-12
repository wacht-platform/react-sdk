import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";

export interface ActorMcpServerSummary {
    id: string;
    name: string;
    endpoint: string;
    auth_type: string;
    requires_user_connection: boolean;
    connection_status: "ready" | "connected" | "not_connected" | "expired";
    connected_at?: string;
    expires_at?: string;
}

interface ActorMcpServerConnectResponse {
    auth_url: string;
}

interface ApiEnvelope<T> {
    data: T;
    message?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok) {
        throw new Error(payload.message || "Request failed");
    }
    return payload.data;
}

export function useActorMcpServers(enabled = true) {
    const { client } = useClient();
    const key = enabled ? "wacht-ai-actor-mcp-servers" : null;

    const fetcher = useCallback(async () => {
        const response = await client(`/ai/mcp-servers`);
        return parseResponse<ActorMcpServerSummary[]>(response);
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
            return parseResponse<ActorMcpServerConnectResponse>(response);
        },
        [client],
    );

    const disconnect = useCallback(
        async (mcpServerId: string) => {
            const response = await client(`/ai/mcp-servers/${mcpServerId}/disconnect`, {
                method: "POST",
                body: new URLSearchParams(),
            });
            await parseResponse<{ success: boolean }>(response);
            await mutate();
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
