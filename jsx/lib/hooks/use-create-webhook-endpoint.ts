import { useCallback } from "react";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { buildCreateEndpointFormData } from "./webhook-app-form-data";
import type { ApiResult, CreateEndpointOptions, EndpointWithSubscriptions } from "@wacht/types";

interface UseCreateWebhookEndpointReturn {
	createEndpoint: (options: CreateEndpointOptions) => Promise<ApiResult<EndpointWithSubscriptions>>;
	loading: boolean;
	error: unknown;
}

export function useCreateWebhookEndpoint(): UseCreateWebhookEndpointReturn {
	const { client } = useClient();

	const createEndpoint = useCallback(async (options: CreateEndpointOptions): Promise<ApiResult<EndpointWithSubscriptions>> => {
		// Use form data to avoid CORS preflight.
		const formData = buildCreateEndpointFormData(options);

		const response = await client("/webhook/endpoints", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData.toString(),
		});

		const parsed = await responseMapper<EndpointWithSubscriptions>(response);
		return parsed;
	}, [client]);

	return {
		createEndpoint,
		loading: false,
		error: null,
	};
}
