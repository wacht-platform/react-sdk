import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type { WebhookTimeseriesResponse, UseWebhookTimeseriesOptions } from "@wacht/types";

export function useWebhookTimeseries(options: UseWebhookTimeseriesOptions = {}) {
	const { client } = useClient();

	const fetcher = useCallback(async () => {
		const params = new URLSearchParams();
		if (options.start_date) params.set("start_date", options.start_date);
		if (options.end_date) params.set("end_date", options.end_date);
		if (options.interval) params.set("interval", options.interval);
		if (options.endpoint_id) params.set("endpoint_id", options.endpoint_id);

		const response = await client(`/webhook/analytics/timeseries?${params.toString()}`, {
			method: "GET",
		});

		const parsed = await responseMapper<WebhookTimeseriesResponse>(response);
		return parsed.data;
	}, [client, options.start_date, options.end_date, options.interval, options.endpoint_id]);

	const { data, error, isLoading, mutate } = useSWR(
		() => {
			const params = new URLSearchParams();
			if (options.start_date) params.set("start_date", options.start_date);
			if (options.end_date) params.set("end_date", options.end_date);
			if (options.interval) params.set("interval", options.interval);
			if (options.endpoint_id) params.set("endpoint_id", options.endpoint_id);
			return `wacht-webhook-timeseries?${params.toString()}`;
		},
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false
		}
	);

	return {
		timeseries: data?.data || [],
		interval: data?.interval || "hour",
		loading: isLoading,
		error,
		refetch: () => mutate()
	};
}
