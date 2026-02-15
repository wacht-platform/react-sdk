export type RateLimitUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'calendar_day' | 'month' | 'calendar_month';
export type RateLimitMode = 'per_app' | 'per_key' | 'per_key_and_ip' | 'per_app_and_ip';
export type AuthzPrincipalType = 'api_key';
export type AuthzDenyReason = 'permission_denied' | 'rate_limited';

export interface RateLimit {
	unit: RateLimitUnit;
	duration: number;
	max_requests: number;
	mode?: RateLimitMode;
}

export interface AuthzPrincipal {
	type: AuthzPrincipalType;
	value: string;
}

export interface AuthzCheckRequest {
	principal: AuthzPrincipal;
	resource: string;
	method: string;
	client_ip?: string;
	user_agent?: string;
	required_permissions?: string[];
}

export interface AuthzIdentity {
	key_id: string;
	deployment_id: string;
	app_id: string;
	app_slug: string;
	key_name: string;
	organization_id?: string;
	workspace_id?: string;
	organization_membership_id?: string;
	workspace_membership_id?: string;
}

export interface AuthzRateLimitState {
	rule: string;
	remaining: number;
	limit: number;
}

export interface AuthzCheckResponse {
	request_id: string;
	allowed: boolean;
	reason?: AuthzDenyReason;
	blocked_rule?: string;
	identity?: AuthzIdentity;
	permissions: string[];
	metadata?: Record<string, unknown>;
	rate_limits: AuthzRateLimitState[];
	retry_after?: number;
	headers: Record<string, string>;
}

export interface ApiAuthAppInfo {
	id: string;
	app_slug: string;
	name: string;
	key_prefix: string;
	description?: string;
	is_active: boolean;
	rate_limits: RateLimit[];
}

export interface ApiKey {
	id: string;
	name: string;
	key_prefix: string;
	key_suffix: string;
	permissions: string[];
	org_role_permissions: string[];
	workspace_role_permissions: string[];
	organization_id?: string;
	workspace_id?: string;
	organization_membership_id?: string;
	workspace_membership_id?: string;
	expires_at?: string;
	last_used_at?: string;
	is_active: boolean;
	created_at: string;
	revoked_at?: string;
	revoked_reason?: string;
}

export interface ApiKeyWithSecret {
	id: string;
	name: string;
	key_prefix: string;
	key_suffix: string;
	permissions: string[];
	expires_at?: string;
	last_used_at?: string;
	is_active: boolean;
	created_at: string;
	revoked_at?: string;
	revoked_reason?: string;
	secret: string;
}

export interface ApiAuthAppSessionData {
	session_id: string;
	api_auth_app: ApiAuthAppInfo;
}

export interface ApiAuditLog {
	request_id: string;
	deployment_id: number;
	app_slug: string;
	key_id: number;
	key_name: string;
	outcome: string;
	blocked_by_rule?: string;
	client_ip: string;
	path: string;
	user_agent: string;
	rate_limits?: string;
	timestamp: string;
}

export interface ApiAuditLogsResponse {
	data: ApiAuditLog[];
	limit: number;
	has_more: boolean;
	next_cursor?: string;
}

export interface ApiAuditAnalyticsResponse {
	total_requests: number;
	allowed_requests: number;
	blocked_requests: number;
	success_rate: number;
	keys_used_24h: number;
	top_keys?: KeyStatsItem[];
	top_paths?: PathStatsItem[];
	blocked_reasons?: BlockedReasonItem[];
	rate_limit_stats?: RateLimitBreakdown;
}

export interface KeyStatsItem {
	key_id: number;
	key_name: string;
	total_requests: number;
}

export interface PathStatsItem {
	path: string;
	total_requests: number;
}

export interface BlockedReasonItem {
	blocked_by_rule: string;
	count: number;
	percentage: number;
}

export interface RateLimitBreakdown {
	total_hits: number;
	percentage_of_blocked: number;
	top_rules?: RateLimitStatsItem[];
}

export interface RateLimitStatsItem {
	rule: string;
	hit_count: number;
	percentage: number;
}

export interface ApiAuditTimeseriesPoint {
	timestamp: string;
	total_requests: number;
	allowed_requests: number;
	blocked_requests: number;
	success_rate: number;
}

export interface ApiAuditTimeseriesResponse {
	data: ApiAuditTimeseriesPoint[];
	interval: string;
}

export type ApiKeyStatus = "active" | "revoked" | "all";

export interface UseApiAuthKeysFilters {
	status?: ApiKeyStatus;
}

export interface CreateApiAuthKeyInput {
	name: string;
	expires_at?: string;
}

export interface RotateApiAuthKeyInput {
	key_id: string;
}

export interface RevokeApiAuthKeyInput {
	key_id: string;
	reason?: string;
}

export interface UseApiAuthAuditLogsOptions {
	limit?: number;
	cursor?: string;
	outcome?: "allowed" | "blocked";
	key_id?: string;
	start_date?: string;
	end_date?: string;
}

export interface UseApiAuthAuditAnalyticsOptions {
	start_date?: string;
	end_date?: string;
	key_id?: string;
	include_top_keys?: boolean;
	include_top_paths?: boolean;
	include_blocked_reasons?: boolean;
	include_rate_limits?: boolean;
	top_limit?: number;
}

export interface UseApiAuthAuditTimeseriesOptions {
	start_date?: string;
	end_date?: string;
	interval?: string;
	key_id?: string;
}
