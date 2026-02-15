import type {
	CreateEndpointOptions,
	ReplayWebhookDeliveryOptions,
	TestEndpointOptions,
	UpdateEndpointOptions,
} from "@wacht/types"

export function buildCreateEndpointFormData(options: CreateEndpointOptions): URLSearchParams {
	const formData = new URLSearchParams()
	formData.append("url", options.url)
	if (options.description) formData.append("description", options.description)
	if (options.subscribed_events) {
		options.subscribed_events.forEach((event) => formData.append("subscribed_events", event))
	}
	if (options.subscriptions && options.subscriptions.length > 0) {
		formData.append("subscriptions", JSON.stringify(options.subscriptions))
	}
	if (options.headers) {
		Object.entries(options.headers).forEach(([key, value]) => {
			formData.append(`headers[${key}]`, value)
		})
	}
	if (options.rate_limit_config) {
		formData.append("rate_limit[duration_ms]", options.rate_limit_config.duration_ms.toString())
		formData.append("rate_limit[max_requests]", options.rate_limit_config.max_requests.toString())
	}
	return formData
}

export function buildUpdateEndpointFormData(options: UpdateEndpointOptions): URLSearchParams {
	const formData = new URLSearchParams()
	if (options.url) formData.append("url", options.url)
	if (options.description !== undefined) formData.append("description", options.description || "")
	if (options.subscribed_events) {
		options.subscribed_events.forEach((event) => formData.append("subscribed_events", event))
	}
	if (options.subscriptions && options.subscriptions.length > 0) {
		formData.append("subscriptions", JSON.stringify(options.subscriptions))
	}
	if (options.headers) {
		Object.entries(options.headers).forEach(([key, value]) => {
			formData.append(`headers[${key}]`, value)
		})
	}
	if (options.is_active !== undefined) formData.append("is_active", options.is_active.toString())
	if (options.rate_limit_config) {
		formData.append("rate_limit[duration_ms]", options.rate_limit_config.duration_ms.toString())
		formData.append("rate_limit[max_requests]", options.rate_limit_config.max_requests.toString())
	}
	return formData
}

export function buildTestEndpointFormData(options: TestEndpointOptions): URLSearchParams {
	const formData = new URLSearchParams()
	formData.append("event_name", options.event_name)
	formData.append("payload", JSON.stringify(options.payload || {}))
	return formData
}

export function buildReplayFormData(options: ReplayWebhookDeliveryOptions): URLSearchParams {
	const formData = new URLSearchParams()
	const deliveryIds = options.delivery_ids || []
	deliveryIds.forEach((id) => formData.append("delivery_ids", id))
	if (options.start_date) formData.append("start_date", options.start_date)
	if (options.end_date) formData.append("end_date", options.end_date)
	if (options.status) formData.append("status", options.status)
	if (options.event_name) formData.append("event_name", options.event_name)
	if (options.endpoint_id) formData.append("endpoint_id", options.endpoint_id)
	if (options.idempotency_key) formData.append("idempotency_key", options.idempotency_key)
	return formData
}
