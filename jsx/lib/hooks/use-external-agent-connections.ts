import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";

export type ExternalAgentConnectionStatus =
    | "disconnected"
    | "pending"
    | "active"
    | "expired"
    | "failed";

export interface ExternalAgentConnection {
    provider: string;
    slug: string;
    display_name: string;
    logo_url?: string;
    status: ExternalAgentConnectionStatus;
    external_account_id?: string;
    connected_at?: string;
}

interface ConnectResponse {
    redirect_url: string;
}

export function useExternalAgentConnections(enabled = true) {
    const { client } = useClient();
    const key = enabled ? "wacht-ai-external-agent-connections" : null;

    const fetcher = useCallback(async () => {
        const response = await client(`/ai/external-connections`);
        const parsed = await responseMapper<ExternalAgentConnection[]>(response);
        return parsed.data;
    }, [client]);

    const { data, error, mutate, isLoading } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    const connect = useCallback(
        async (
            provider: string,
            slug: string,
            options?: { returnUrl?: string },
        ) => {
            const response = await client(
                `/ai/external-connections/${encodeURIComponent(provider)}/${encodeURIComponent(slug)}/connect`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        return_url: options?.returnUrl ?? "",
                    }),
                },
            );
            const parsed = await responseMapper<ConnectResponse>(response);
            await mutate();
            return parsed.data;
        },
        [client, mutate],
    );

    const disconnect = useCallback(
        async (provider: string, slug: string) => {
            const response = await client(
                `/ai/external-connections/${encodeURIComponent(provider)}/${encodeURIComponent(slug)}`,
                { method: "DELETE" },
            );
            const parsed = await responseMapper<{ success: boolean }>(response);
            await mutate();
            return parsed.data;
        },
        [client, mutate],
    );

    return {
        connections: data ?? [],
        loading: isLoading,
        error,
        connect,
        disconnect,
        refetch: async () => {
            await mutate();
        },
    };
}
