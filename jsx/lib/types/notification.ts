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
  group_id?: string;
  group_count: number;
  dedupe_key?: string;
  source?: string;
  source_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export interface BulkUpdateResponse {
  affected: number;
}