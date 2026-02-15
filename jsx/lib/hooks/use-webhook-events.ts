import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type { WebhookAppEvent } from "@wacht/types";

export function useWebhookEvents() {
	const { client } = useClient();

	const fetcher = useCallback(async () => {
		const response = await client("/webhook/events", {
			method: "GET",
		});

		const parsed = await responseMapper<WebhookAppEvent[]>(response);
		return parsed.data;
	}, [client]);

	const { data, error, isLoading, mutate } = useSWR<WebhookAppEvent[]>(
		"wacht-webhook-events",
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false
		}
	);

	return {
		events: data || [],
		loading: isLoading,
		error,
		refetch: () => mutate()
	};
}
