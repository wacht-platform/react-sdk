import { useCallback } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type {
	ApiKey,
	ApiKeyWithSecret,
	CreateApiAuthKeyInput,
	RevokeApiAuthKeyInput,
	RotateApiAuthKeyInput,
	UseApiAuthKeysFilters,
} from "@wacht/types";

export interface UseApiAuthKeysReturn {
	keys: ApiKey[];
	createKey: (input: CreateApiAuthKeyInput) => Promise<ApiKeyWithSecret>;
	rotateKey: (input: RotateApiAuthKeyInput) => Promise<ApiKeyWithSecret>;
	revokeKey: (input: RevokeApiAuthKeyInput) => Promise<void>;
	loading: boolean;
	error: unknown;
	refetch: () => void;
}

export function useApiAuthKeys(filters: UseApiAuthKeysFilters = {}): UseApiAuthKeysReturn {
	const { client } = useClient();

	const fetcher = useCallback(async (): Promise<ApiKey[]> => {
		const params = new URLSearchParams();
		if (filters.status) {
			params.set("status", filters.status);
		}

		const response = await client(`/api-auth/keys${params.toString() ? `?${params.toString()}` : ""}`, {
			method: "GET",
		});

		const parsed = await responseMapper<ApiKey[]>(response);
		return parsed.data;
	}, [client, filters.status]);

	const { data, error, isLoading, mutate } = useSWR<ApiKey[]>(
		`wacht-api-auth-keys:${filters.status || "all"}`,
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false
		}
	);

	const createKey = useCallback(async (input: CreateApiAuthKeyInput): Promise<ApiKeyWithSecret> => {
		const formData = new URLSearchParams();
		formData.set("name", input.name);
		if (input.expires_at) {
			formData.set("expires_at", input.expires_at);
		}

		const response = await client("/api-auth/keys", {
			method: "POST",
			body: formData,
		});

		const parsed = await responseMapper<ApiKeyWithSecret>(response);
		await mutate();
		return parsed.data;
	}, [client, mutate]);

	const rotateKey = useCallback(async (input: RotateApiAuthKeyInput): Promise<ApiKeyWithSecret> => {
		const response = await client(`/api-auth/keys/${input.key_id}/rotate`, {
			method: "POST",
		});

		const parsed = await responseMapper<ApiKeyWithSecret>(response);
		await mutate();
		return parsed.data;
	}, [client, mutate]);

	const revokeKey = useCallback(async (input: RevokeApiAuthKeyInput): Promise<void> => {
		const formData = new URLSearchParams();
		if (input.reason) {
			formData.set("reason", input.reason);
		}

		await client(`/api-auth/keys/${input.key_id}/revoke`, {
			method: "POST",
			body: formData,
		});

		await mutate();
	}, [client, mutate]);

	return {
		keys: data || [],
		createKey,
		rotateKey,
		revokeKey,
		loading: isLoading,
		error,
		refetch: () => mutate()
	};
}
