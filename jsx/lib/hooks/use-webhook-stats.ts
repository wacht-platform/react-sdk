import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type { WebhookStats } from "@wacht/types";

export function useWebhookStats() {
	const { client } = useClient();

	const fetcher = useCallback(async () => {
		const response = await client("/webhook/stats", {
			method: "GET",
		});

		const parsed = await responseMapper<WebhookStats>(response);
		return parsed.data;
	}, [client]);

	const { data, error, isLoading, mutate } = useSWR(
		"wacht-webhook-stats",
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false
		}
	);

	return {
		stats: data || null,
		loading: isLoading,
		error,
		refetch: () => mutate()
	};
}
