import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import type { CancelReplayTaskOptions, ReplayTaskListOptions, ReplayTaskStatusOptions } from "@wacht/types";
import { useClient } from "./use-client";
import {
    cancelWebhookReplayTask,
    createWebhookEndpoint,
    deleteWebhookEndpoint,
    exchangeWebhookTicket,
    fetchWebhookAppSession,
    fetchWebhookDeliveryDetail,
    fetchWebhookReplayTasks,
    fetchWebhookReplayTaskStatus,
    replayWebhookDelivery,
    rotateWebhookSecret,
    testWebhookEndpoint,
    updateWebhookEndpoint,
} from "./webhook-app-api";
import type { UseWebhookAppSessionResult } from "./webhook-app-types";

export function useWebhookAppSession(
    ticket?: string | null,
): UseWebhookAppSessionResult {
    const { client } = useClient();

    const [ticketExchanged, setTicketExchanged] = useState(!ticket);
    const [ticketLoading, setTicketLoading] = useState(!!ticket);
    const [ticketError, setTicketError] = useState<Error | null>(null);
    const exchangedRef = useRef(false);
    const exchangingRef = useRef(false);

    const shouldFetch = ticketExchanged;

    const fetcher = useCallback(async () => {
        return fetchWebhookAppSession(client);
    }, [client]);

    const { data, error: fetchError, isLoading, mutate } = useSWR(
        shouldFetch ? "wacht-webhook-app-session" : null,
        fetcher,
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        },
    );

    useEffect(() => {
        if (!ticket || exchangedRef.current || exchangingRef.current) return;

        const exchange = async () => {
            exchangingRef.current = true;
            setTicketLoading(true);
            try {
                await exchangeWebhookTicket(client, ticket);
                exchangedRef.current = true;
                setTicketExchanged(true);
            } catch (err) {
                setTicketError(
                    err instanceof Error ? err : new Error("Failed to exchange ticket"),
                );
            } finally {
                setTicketLoading(false);
                exchangingRef.current = false;
            }
        };

        void exchange();
    }, [ticket, client]);

    const createEndpoint = useCallback(
        async (options: Parameters<typeof createWebhookEndpoint>[1]) => {
            return createWebhookEndpoint(client, options);
        },
        [client],
    );

    const updateEndpoint = useCallback(
        async (
            endpointId: string,
            options: Parameters<typeof updateWebhookEndpoint>[2],
        ) => {
            return updateWebhookEndpoint(client, endpointId, options);
        },
        [client],
    );

    const deleteEndpoint = useCallback(
        async (endpointId: string) => {
            return deleteWebhookEndpoint(client, endpointId);
        },
        [client],
    );

    const testEndpoint = useCallback(
        async (
            endpointId: string,
            options: Parameters<typeof testWebhookEndpoint>[2],
        ) => {
            return testWebhookEndpoint(client, endpointId, options);
        },
        [client],
    );

    const rotateSecret = useCallback(async () => {
        return rotateWebhookSecret(client);
    }, [client]);

    const replayDelivery = useCallback(
        async (options: Parameters<typeof replayWebhookDelivery>[1]) => {
            return replayWebhookDelivery(client, options);
        },
        [client],
    );

    const fetchDeliveryDetail = useCallback(
        async (deliveryId: string) => {
            return fetchWebhookDeliveryDetail(client, deliveryId);
        },
        [client],
    );

    const fetchReplayTaskStatus = useCallback(
        async (options: ReplayTaskStatusOptions) => {
            return fetchWebhookReplayTaskStatus(client, options);
        },
        [client],
    );

    const fetchReplayTasks = useCallback(
        async (options?: ReplayTaskListOptions) => {
            return fetchWebhookReplayTasks(client, options);
        },
        [client],
    );

    const cancelReplayTask = useCallback(
        async (options: CancelReplayTaskOptions) => {
            return cancelWebhookReplayTask(client, options);
        },
        [client],
    );

    const hasSession = !fetchError || fetchError.message !== "NO_SESSION";
    const sessionError =
        ticketError ||
        (fetchError && fetchError.message !== "NO_SESSION" ? fetchError : null);
    const sessionLoading = ticketLoading || (shouldFetch && isLoading);

    return {
        hasSession,
        sessionLoading,
        sessionError,
        sessionId: data?.session_id || null,
        webhookApp: data?.webhook_app || null,
        ticketExchanged,
        ticketLoading,
        refetch: async () => {
            await mutate();
        },
        createEndpoint,
        updateEndpoint,
        deleteEndpoint,
        testEndpoint,
        rotateSecret,
        replayDelivery,
        fetchReplayTaskStatus,
        fetchReplayTasks,
        cancelReplayTask,
        fetchDeliveryDetail,
    };
}
