import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type { EndpointWithSubscriptions } from "@wacht/types";

export function useWebhookEndpoints() {
	const { client } = useClient();

	const fetcher = useCallback(async () => {
		const response = await client("/webhook/endpoints", {
			method: "GET",
		});

		const parsed = await responseMapper<EndpointWithSubscriptions[]>(response);
		return parsed.data;
	}, [client]);

	const { data, error, isLoading, mutate } = useSWR<EndpointWithSubscriptions[]>(
		"wacht-webhook-endpoints",
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false
		}
	);

	return {
		endpoints: data || [],
		loading: isLoading,
		error,
		refetch: () => mutate()
	};
}
