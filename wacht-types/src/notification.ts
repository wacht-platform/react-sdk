export interface Notification {
    id: string;
    deployment_id: string;
    user_id: string;
    organization_id?: string;
    workspace_id?: string;
    title: string;
    body: string;
    ctas?: { label: string; payload: any }[];
    severity: "info" | "success" | "warning" | "error";
    is_read: boolean;
    read_at?: string;
    is_archived: boolean;
    archived_at?: string;
    is_starred: boolean;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    expires_at?: string;
}

export interface ChannelCounts {
    user: number;
    organization: number;
    workspace: number;
    current: number;
    total: number;
}

export interface NotificationListResponse {
    notifications: Notification[];
    has_more: boolean;
}

export interface ScopeUnreadResponse {
    count: number;
}

export interface NotificationListParams {
    limit?: number;
    cursor?: string;
    scope?: "all" | "current" | "user";
    is_read?: boolean;
    is_archived?: boolean;
    is_starred?: boolean;
    severity?: "info" | "success" | "warning" | "error";
}

export interface BulkUpdateResponse {
    affected: number;
}
