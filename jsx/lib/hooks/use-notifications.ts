import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import useSWR from "swr";
import { useCallback, useEffect } from "react";
import { ApiResult } from "@/types";
import { 
  Notification, 
  NotificationListResponse, 
  BulkUpdateResponse 
} from "@/types/notification";
import { Client } from "@/types";
import { useNotificationStream, type NotificationMessage } from "./use-notification-stream";

type UseNotificationsReturnType =
  | {
      loading: true;
      notifications: never;
      unreadCount: never;
      hasMore: never;
      markAsRead: never;
      markAllAsRead: never;
      deleteNotification: never;
      error: Error | null;
      refetch: () => Promise<void>;
    }
  | {
      loading: false;
      error: Error | null;
      notifications: Notification[];
      unreadCount: number;
      hasMore: boolean;
      markAsRead: (notificationId: string) => Promise<void>;
      markAllAsRead: () => Promise<void>;
      deleteNotification: (notificationId: string) => Promise<void>;
      refetch: () => Promise<void>;
    };

async function fetchNotifications(client: Client): Promise<NotificationListResponse> {
  const response = await client("/notifications", {
    method: "GET",
  });
  const responseParsed = await responseMapper<NotificationListResponse>(response);
  return responseParsed.data;
}

async function markNotificationAsRead(
  client: Client,
  notificationId: string
): Promise<ApiResult<{ success: boolean }>> {
  const response = await client(`/notifications/${notificationId}/read`, {
    method: "POST",
  });
  return responseMapper(response);
}

async function markAllNotificationsAsRead(
  client: Client
): Promise<ApiResult<BulkUpdateResponse>> {
  const response = await client("/notifications/mark-all-read", {
    method: "POST",
  });
  return responseMapper(response);
}

async function deleteNotification(
  client: Client,
  notificationId: string
): Promise<ApiResult<{ success: boolean }>> {
  const response = await client(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
  return responseMapper(response);
}

export function useNotifications(): UseNotificationsReturnType {
  const { client, loading: clientLoading } = useClient();

  const {
    data,
    error,
    mutate: refetch,
  } = useSWR(
    !clientLoading ? ["notifications"] : null,
    () => fetchNotifications(client),
    {
      refreshInterval: 60000, // Poll every 60 seconds as fallback
      revalidateOnFocus: true,
    }
  );

  // Set up WebSocket for real-time notifications
  const { isConnected } = useNotificationStream({
    enabled: !clientLoading && !!data,
    onNotification: useCallback(
      (notification: NotificationMessage) => {
        // Add new notification to the list
        refetch(
          async (current) => {
            if (!current) return current;
            
            // Check if notification already exists
            const exists = current.notifications.some(n => n.id === notification.id.toString());
            if (exists) return current;
            
            // Add new notification at the beginning
            return {
              ...current,
              notifications: [
                {
                  id: notification.id.toString(),
                  user_id: notification.user_id.toString(),
                  deployment_id: notification.deployment_id.toString(),
                  title: notification.title,
                  body: notification.body,
                  severity: notification.severity,
                  action_url: notification.action_url,
                  action_label: notification.action_label,
                  is_read: false,
                  is_archived: false,
                  created_at: notification.created_at,
                  updated_at: notification.created_at,
                } as Notification,
                ...current.notifications,
              ],
              unread_count: current.unread_count + 1,
              total: current.total + 1,
            };
          },
          false
        );
      },
      [refetch]
    ),
    onError: useCallback(
      (error: string) => {
        console.error('Notification stream error:', error);
      },
      []
    ),
  });

  useEffect(() => {
    if (isConnected) {
      console.log('Real-time notifications connected');
    }
  }, [isConnected]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (clientLoading) return;
      
      // Optimistically update the UI
      await refetch(
        async (current) => {
          if (!current) return current;
          return {
            ...current,
            notifications: current.notifications.map((n) =>
              n.id === notificationId ? { ...n, is_read: true } : n
            ),
            unread_count: Math.max(0, current.unread_count - 1),
          };
        },
        false
      );

      // Make the API call
      await markNotificationAsRead(client, notificationId);
      
      // Revalidate
      await refetch();
    },
    [client, clientLoading, refetch]
  );

  const markAllAsRead = useCallback(async () => {
    if (clientLoading) return;
    
    // Optimistically update the UI
    await refetch(
      async (current) => {
        if (!current) return current;
        return {
          ...current,
          notifications: current.notifications.map((n) => ({ ...n, is_read: true })),
          unread_count: 0,
        };
      },
      false
    );

    // Make the API call
    await markAllNotificationsAsRead(client);
    
    // Revalidate
    await refetch();
  }, [client, refetch]);

  const deleteNotificationCallback = useCallback(
    async (notificationId: string) => {
      if (clientLoading) return;
      
      // Optimistically update the UI
      await refetch(
        async (current) => {
          if (!current) return current;
          const notification = current.notifications.find((n) => n.id === notificationId);
          return {
            ...current,
            notifications: current.notifications.filter((n) => n.id !== notificationId),
            unread_count: notification && !notification.is_read 
              ? Math.max(0, current.unread_count - 1) 
              : current.unread_count,
            total: Math.max(0, current.total - 1),
          };
        },
        false
      );

      // Make the API call
      await deleteNotification(client, notificationId);
      
      // Revalidate
      await refetch();
    },
    [client, clientLoading, refetch]
  );

  const refetchWrapper = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (!data || clientLoading) {
    return {
      loading: true,
      notifications: undefined as never,
      unreadCount: undefined as never,
      hasMore: undefined as never,
      markAsRead: undefined as never,
      markAllAsRead: undefined as never,
      deleteNotification: undefined as never,
      error,
      refetch: refetchWrapper,
    } as const;
  }

  return {
    loading: false,
    error,
    notifications: data.notifications,
    unreadCount: data.unread_count,
    hasMore: data.has_more,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationCallback,
    refetch: refetchWrapper,
  } as const;
}