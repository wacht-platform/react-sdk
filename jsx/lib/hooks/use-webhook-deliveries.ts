import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type { UseWebhookDeliveriesOptions, WebhookDeliveriesResponse } from "@wacht/types";

export function useWebhookDeliveries(options: UseWebhookDeliveriesOptions = {}) {
	const { client } = useClient();

	const fetcher = useCallback(async () => {
		const params = new URLSearchParams();
		if (options.endpoint_id) params.set("endpoint_id", options.endpoint_id);
		if (options.status) params.set("status", options.status);
		if (options.event_name) params.set("event_name", options.event_name);
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.cursor) params.set("cursor", options.cursor);

		const response = await client(`/webhook/deliveries?${params.toString()}`, {
			method: "GET",
		});

		const parsed = await responseMapper<WebhookDeliveriesResponse>(response);
		return parsed.data;
	}, [client, options.endpoint_id, options.status, options.event_name, options.limit, options.cursor]);

	const { data, error, isLoading, mutate } = useSWR(
		() => {
			const params = new URLSearchParams();
			if (options.endpoint_id) params.set("endpoint_id", options.endpoint_id);
			if (options.status) params.set("status", options.status);
			if (options.event_name) params.set("event_name", options.event_name);
			if (options.limit) params.set("limit", options.limit.toString());
			if (options.cursor) params.set("cursor", options.cursor);
			return `wacht-webhook-deliveries?${params.toString()}`;
		},
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false
		}
	);

	return {
		deliveries: data?.data || [],
		has_more: data?.has_more || false,
		next_cursor: data?.next_cursor,
		loading: isLoading,
		error,
		refetch: () => mutate()
	};
}
