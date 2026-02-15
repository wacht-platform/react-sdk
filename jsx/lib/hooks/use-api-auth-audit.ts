import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type {
	ApiAuditAnalyticsResponse,
	ApiAuditLogsResponse,
	ApiAuditTimeseriesResponse,
	UseApiAuthAuditAnalyticsOptions,
	UseApiAuthAuditLogsOptions,
	UseApiAuthAuditTimeseriesOptions,
} from "@wacht/types";

interface UseApiAuthAuditLogsReturn {
	logs: ApiAuditLogsResponse["data"];
	limit: number;
	has_more: boolean;
	next_cursor?: string;
	loading: boolean;
	error: unknown;
	refetch: () => void;
}

interface UseApiAuthAuditAnalyticsReturn {
	analytics: ApiAuditAnalyticsResponse | null;
	loading: boolean;
	error: unknown;
	refetch: () => void;
}

interface UseApiAuthAuditTimeseriesReturn {
	timeseries: ApiAuditTimeseriesResponse["data"];
	interval: string;
	loading: boolean;
	error: unknown;
	refetch: () => void;
}

export function useApiAuthAuditLogs(options: UseApiAuthAuditLogsOptions = {}): UseApiAuthAuditLogsReturn {
	const { client } = useClient();

	const fetcher = useCallback(async (): Promise<ApiAuditLogsResponse> => {
		const params = new URLSearchParams();
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.cursor) params.set("cursor", options.cursor);
		if (options.outcome) params.set("outcome", options.outcome);
		if (options.key_id) params.set("key_id", options.key_id);
		if (options.start_date) params.set("start_date", options.start_date);
		if (options.end_date) params.set("end_date", options.end_date);

		const response = await client(`/api-auth/audit/logs?${params.toString()}`, {
			method: "GET",
		});

		const parsed = await responseMapper<ApiAuditLogsResponse>(response);
		return parsed.data;
	}, [client, options.limit, options.cursor, options.outcome, options.key_id, options.start_date, options.end_date]);

	const { data, error, isLoading, mutate } = useSWR<ApiAuditLogsResponse>(
		() => {
			const params = new URLSearchParams();
			if (options.limit) params.set("limit", options.limit.toString());
			if (options.cursor) params.set("cursor", options.cursor);
			if (options.outcome) params.set("outcome", options.outcome);
			if (options.key_id) params.set("key_id", options.key_id);
			if (options.start_date) params.set("start_date", options.start_date);
			if (options.end_date) params.set("end_date", options.end_date);
			return `wacht-api-auth-audit-logs?${params.toString()}`;
		},
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false,
		}
	);

	return {
		logs: data?.data || [],
		limit: data?.limit || options.limit || 0,
		has_more: data?.has_more || false,
		next_cursor: data?.next_cursor,
		loading: isLoading,
		error,
		refetch: () => mutate(),
	};
}

export function useApiAuthAuditAnalytics(options: UseApiAuthAuditAnalyticsOptions = {}): UseApiAuthAuditAnalyticsReturn {
	const { client } = useClient();

	const fetcher = useCallback(async (): Promise<ApiAuditAnalyticsResponse> => {
		const params = new URLSearchParams();
		if (options.start_date) params.set("start_date", options.start_date);
		if (options.end_date) params.set("end_date", options.end_date);
		if (options.key_id) params.set("key_id", options.key_id);
		if (options.include_top_keys) params.set("include_top_keys", "true");
		if (options.include_top_paths) params.set("include_top_paths", "true");
		if (options.include_blocked_reasons) params.set("include_blocked_reasons", "true");
		if (options.include_rate_limits) params.set("include_rate_limits", "true");
		if (options.top_limit) params.set("top_limit", options.top_limit.toString());

		const response = await client(`/api-auth/audit/analytics?${params.toString()}`, {
			method: "GET",
		});

		const parsed = await responseMapper<ApiAuditAnalyticsResponse>(response);
		return parsed.data;
	}, [
		client,
		options.start_date,
		options.end_date,
		options.key_id,
		options.include_top_keys,
		options.include_top_paths,
		options.include_blocked_reasons,
		options.include_rate_limits,
		options.top_limit,
	]);

	const { data, error, isLoading, mutate } = useSWR<ApiAuditAnalyticsResponse>(
		() => {
			const params = new URLSearchParams();
			if (options.start_date) params.set("start_date", options.start_date);
			if (options.end_date) params.set("end_date", options.end_date);
			if (options.key_id) params.set("key_id", options.key_id);
			if (options.include_top_keys) params.set("include_top_keys", "true");
			if (options.include_top_paths) params.set("include_top_paths", "true");
			if (options.include_blocked_reasons) params.set("include_blocked_reasons", "true");
			if (options.include_rate_limits) params.set("include_rate_limits", "true");
			if (options.top_limit) params.set("top_limit", options.top_limit.toString());
			return `wacht-api-auth-audit-analytics?${params.toString()}`;
		},
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false,
		}
	);

	return {
		analytics: data || null,
		loading: isLoading,
		error,
		refetch: () => mutate(),
	};
}

export function useApiAuthAuditTimeseries(options: UseApiAuthAuditTimeseriesOptions = {}): UseApiAuthAuditTimeseriesReturn {
	const { client } = useClient();

	const fetcher = useCallback(async (): Promise<ApiAuditTimeseriesResponse> => {
		const params = new URLSearchParams();
		if (options.start_date) params.set("start_date", options.start_date);
		if (options.end_date) params.set("end_date", options.end_date);
		if (options.interval) params.set("interval", options.interval);
		if (options.key_id) params.set("key_id", options.key_id);

		const response = await client(`/api-auth/audit/timeseries?${params.toString()}`, {
			method: "GET",
		});

		const parsed = await responseMapper<ApiAuditTimeseriesResponse>(response);
		return parsed.data;
	}, [client, options.start_date, options.end_date, options.interval, options.key_id]);

	const { data, error, isLoading, mutate } = useSWR<ApiAuditTimeseriesResponse>(
		() => {
			const params = new URLSearchParams();
			if (options.start_date) params.set("start_date", options.start_date);
			if (options.end_date) params.set("end_date", options.end_date);
			if (options.interval) params.set("interval", options.interval);
			if (options.key_id) params.set("key_id", options.key_id);
			return `wacht-api-auth-audit-timeseries?${params.toString()}`;
		},
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false,
		}
	);

	return {
		timeseries: data?.data || [],
		interval: data?.interval || options.interval || "hour",
		loading: isLoading,
		error,
		refetch: () => mutate(),
	};
}
