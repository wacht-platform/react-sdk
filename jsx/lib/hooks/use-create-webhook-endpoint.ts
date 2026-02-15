import { useCallback } from "react";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type { CreateEndpointOptions, EndpointWithSubscriptions } from "@wacht/types";

interface UseCreateWebhookEndpointReturn {
	createEndpoint: (options: CreateEndpointOptions) => Promise<EndpointWithSubscriptions>;
	loading: boolean;
	error: unknown;
}

export function useCreateWebhookEndpoint(): UseCreateWebhookEndpointReturn {
	const { client } = useClient();

	const createEndpoint = useCallback(async (options: CreateEndpointOptions): Promise<EndpointWithSubscriptions> => {
		// Use form data to avoid CORS preflight
		const formData = new URLSearchParams();
		formData.append("url", options.url);
		if (options.description) {
			formData.append("description", options.description);
		}
		// Send each event as a separate form field
		options.subscribed_events.forEach((event) => {
			formData.append("subscribed_events", event);
		});

		const response = await client("/webhook/endpoints", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData.toString(),
		});

		const parsed = await responseMapper<EndpointWithSubscriptions>(response);
		return parsed.data;
	}, [client]);

	return {
		createEndpoint,
		loading: false,
		error: null,
	};
}
