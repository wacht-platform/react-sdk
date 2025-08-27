export interface Notification {
  id: string;
  deployment_id: string;
  user_id: string;
  organization_id?: string;
  workspace_id?: string;
  title: string;
  body: string;
  action_url?: string;
  action_label?: string;
  severity: "info" | "success" | "warning" | "error";
  is_read: boolean;
  read_at?: string;
  is_archived: boolean;
  archived_at?: string;
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
  total: number;
  unread_count: number;
  has_more: boolean;
  channels: string[];
  unread_counts: ChannelCounts;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationListParams {
  limit?: number;
  offset?: number;
  channels?: string[];
  organization_ids?: number[];
  workspace_ids?: number[];
  is_read?: boolean;
  is_archived?: boolean;
  severity?: "info" | "success" | "warning" | "error";
}

export interface BulkUpdateResponse {
  affected: number;
}