export interface TimeseriesPoint {
	timestamp: string;
	total_events: number;
	total_deliveries: number;
	successful_deliveries: number;
	failed_deliveries: number;
	filtered_deliveries: number;
	avg_response_time_ms?: number;
	success_rate: number;
}

export interface WebhookTimeseriesResponse {
	data: TimeseriesPoint[];
	interval: string;
}

export interface WebhookAnalyticsResponse {
	total_deliveries: number;
	total_events: number;
	successful: number;
	failed: number;
	filtered: number;
	success_rate: number;
	avg_response_time_ms?: number;
	p50_response_time_ms?: number;
	p95_response_time_ms?: number;
	p99_response_time_ms?: number;
	avg_payload_size?: number;
	last_delivery?: WebhookDelivery;
}

export interface WebhookDelivery {
	id: string;
	deployment_id: string;
	app_slug: string;
	endpoint_id: string;
	event_name: string;
	event_type: string;
	status: string;
	http_status_code?: number;
	response_status?: number;
	response_time_ms?: number;
	attempt_number: number;
	max_attempts: number;
	timestamp: string;
	created_at: string;
}

export interface RateLimitConfig {
	duration_ms: number;
	max_requests: number;
}

export interface WebhookEndpoint {
	id: string;
	deployment_id: string;
	app_slug: string;
	url: string;
	description?: string;
	headers?: Record<string, string>;
	is_active: boolean;
	max_retries: number;
	timeout_seconds: number;
	failure_count: number;
	last_failure_at?: string;
	auto_disabled: boolean;
	auto_disabled_at?: string;
	rate_limit_config?: RateLimitConfig | null;
	created_at: string;
	updated_at: string;
}

export interface EndpointWithSubscriptions extends WebhookEndpoint {
	subscribed_events: string[];
	subscriptions: WebhookEventSubscription[];
}

export interface WebhookEventSubscription {
	event_name: string;
	filter_rules?: Record<string, unknown>;
}

export interface WebhookStats {
	endpoint_count: number;
	event_count: number;
	pending_deliveries: number;
}

export interface WebhookEndpointStats {
	endpoint_id: string;
	endpoint_url: string;
	total_attempts: number;
	successful_attempts: number;
	failed_attempts: number;
	avg_response_time_ms: number | null;
	success_rate: number;
}

export interface EventStats {
	event_name: string;
	count: number;
}

export interface FailureReasonStats {
	reason: string;
	count: number;
}

export interface WebhookAppStats {
	endpoint_count: number;
	event_count: number;
	pending_deliveries: number;
	total_deliveries: number;
	successful_deliveries: number;
	failed_deliveries: number;
	success_rate: number;
	avg_response_time_ms: number | null;
	top_events: EventStats[];
	endpoint_performance: WebhookEndpointStats[];
	failure_reasons: FailureReasonStats[];
}

export interface CreateEndpointOptions {
	url: string;
	description?: string;
	subscribed_events: string[];
	subscriptions?: WebhookEventSubscription[];
	headers?: Record<string, string>;
	rate_limit_config?: RateLimitConfig | null;
}

export interface UpdateEndpointOptions {
	url?: string;
	description?: string;
	subscribed_events?: string[];
	subscriptions?: WebhookEventSubscription[];
	headers?: Record<string, string>;
	is_active?: boolean;
	rate_limit_config?: RateLimitConfig | null;
}

export interface DeleteEndpointResponse {
	deleted: boolean;
}

export interface TestEndpointOptions {
	event_name: string;
	payload?: Record<string, unknown>;
}

export interface TestEndpointResponse {
	success: boolean;
	message: string;
}

export interface ReplayWebhookDeliveryOptions {
	delivery_ids?: string[];
	start_date?: string;
	end_date?: string;
	status?: string;
	event_name?: string;
	endpoint_id?: string;
	idempotency_key?: string;
}

export interface ReplayWebhookDeliveryResponse {
	status: string;
	message: string;
	task_id?: string;
}

export interface ReplayTaskStatusOptions {
	taskId: string;
}

export interface CancelReplayTaskOptions {
	taskId: string;
}

export interface CancelReplayTaskResponse {
	status: string;
	message: string;
}

export interface ReplayTaskStatusResponse {
	task_id: string;
	app_slug: string;
	status: string;
	created_at?: string;
	started_at?: string;
	completed_at?: string;
	total_count: number;
	processed: number;
	replayed_count: number;
	failed_count: number;
	last_delivery_id?: number;
}

export interface ReplayTaskListOptions {
	limit?: number;
	offset?: number;
}

export interface ReplayTaskListResponse {
	data: ReplayTaskStatusResponse[];
	limit: number;
	offset: number;
	has_more: boolean;
}

export interface UpdateWebhookSettingsOptions {
	failure_notification_emails: string[];
}

export interface WebhookAppInfo {
	app_slug: string;
	name: string;
	signing_secret: string;
	is_active: boolean;
	failure_notification_emails?: string[];
}

export interface WebhookAppSessionData {
	session_id: string;
	webhook_app: WebhookAppInfo;
}

export interface WebhookSettingsResponse {
	failure_notification_emails: string[];
}

// Hook Options Types
export interface UseWebhookDeliveriesOptions {
	endpoint_id?: string;
	status?: string;
	event_name?: string;
	limit?: number;
	cursor?: string;
}

export interface UseWebhookAnalyticsOptions {
	start_date?: string;
	end_date?: string;
	endpoint_id?: string;
	fields?: string[];
}

export interface UseWebhookTimeseriesOptions {
	start_date?: string;
	end_date?: string;
	interval?: string;
	endpoint_id?: string;
}

export interface WebhookDeliveriesResponse {
	data: WebhookDelivery[];
	limit: number;
	has_more: boolean;
	next_cursor?: string;
}

export interface WebhookDeliveryDetail {
	id: string;
	deployment_id: string;
	app_slug: string;
	endpoint_id: string;
	event_name: string;
	event_type: string;
	status: string;
	http_status_code?: number;
	response_status?: number;
	response_time_ms?: number;
	attempt_number: number;
	max_attempts: number;
	error_message?: string;
	payload?: string;
	response_body?: string;
	response_headers?: string;
	request_headers?: string;
	timestamp: string;
	created_at: string;
}
export interface WebhookAppEvent {
	deployment_id: string;
	app_slug: string;
	event_name: string;
	group?: string;
	description?: string;
	schema?: Record<string, unknown>;
	example_payload?: Record<string, unknown>;
	is_archived: boolean;
	created_at: string;
}
