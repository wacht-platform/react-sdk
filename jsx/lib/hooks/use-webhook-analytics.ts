import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type { WebhookAnalyticsResponse, UseWebhookAnalyticsOptions } from "@wacht/types";

interface UseWebhookAnalyticsReturn {
	analytics: WebhookAnalyticsResponse | null;
	loading: boolean;
	error: unknown;
	refetch: () => void;
}

export function useWebhookAnalytics(options: UseWebhookAnalyticsOptions = {}): UseWebhookAnalyticsReturn {
	const { client } = useClient();

	const fetcher = useCallback(async (): Promise<WebhookAnalyticsResponse> => {
		const params = new URLSearchParams();
		if (options.start_date) params.set("start_date", options.start_date);
		if (options.end_date) params.set("end_date", options.end_date);
		if (options.endpoint_id) params.set("endpoint_id", options.endpoint_id);
		if (options.fields && options.fields.length > 0) params.set("fields", options.fields.join(","));

		const response = await client(`/webhook/analytics?${params.toString()}`, {
			method: "GET",
		});

		const parsed = await responseMapper<WebhookAnalyticsResponse>(response);
		return parsed.data;
	}, [client, options.start_date, options.end_date, options.endpoint_id, options.fields]);

	const { data, error, isLoading, mutate } = useSWR<WebhookAnalyticsResponse>(
		() => {
			const params = new URLSearchParams();
			if (options.start_date) params.set("start_date", options.start_date);
			if (options.end_date) params.set("end_date", options.end_date);
			if (options.endpoint_id) params.set("endpoint_id", options.endpoint_id);
			if (options.fields && options.fields.length > 0) params.set("fields", options.fields.join(","));
			return `wacht-webhook-analytics?${params.toString()}`;
		},
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false
		}
	);

	return {
		analytics: data || null,
		loading: isLoading,
		error,
		refetch: () => mutate()
	};
}
