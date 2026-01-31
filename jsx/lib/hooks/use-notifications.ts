import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useCallback, useMemo } from "react";
import { ApiResult } from "@/types";
import {
  Notification,
  NotificationListResponse,
  BulkUpdateResponse,
  NotificationListParams,
  ScopeUnreadResponse,
  Client,
} from "@/types";
import {
  useNotificationStream,
  type NotificationMessage,
} from "./use-notification-stream";

type UseNotificationsReturnType =
  | {
    loading: true;
    notifications: Notification[];
    hasMore: boolean;
    markAsRead: never;
    markAllAsRead: never;
    archiveAllRead: never;
    archiveNotification: never;
    starNotification: never;
    markAsUnread: never;
    error: Error | null;
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
  }
  | {
    loading: false;
    error: Error | null;
    notifications: Notification[];
    hasMore: boolean;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    archiveAllRead: () => Promise<void>;
    archiveNotification: (notificationId: string) => Promise<void>;
    starNotification: (notificationId: string) => Promise<void>;
    markAsUnread: (notificationId: string) => Promise<void>;
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
  };

function toQueryString(params?: NotificationListParams): string {
  if (!params) return "";
  const queryString = new URLSearchParams();
  if (params.limit) queryString.append("limit", params.limit.toString());
  if (params.cursor) queryString.append("cursor", params.cursor);
  if (params.scope) queryString.append("scope", params.scope);
  if (params.is_read !== undefined)
    queryString.append("is_read", params.is_read.toString());
  if (params.is_archived !== undefined)
    queryString.append("is_archived", params.is_archived.toString());
  if (params.is_starred !== undefined)
    queryString.append("is_starred", params.is_starred.toString());
  if (params.severity) queryString.append("severity", params.severity);
  const qs = queryString.toString();
  return qs ? "?" + qs : "";
}

async function fetchNotifications(
  client: Client,
  params?: NotificationListParams,
): Promise<NotificationListResponse> {
  const url = `/notifications${toQueryString(params)}`;

  const response = await client(url, {
    method: "GET",
  });
  const responseParsed =
    await responseMapper<NotificationListResponse>(response);
  return responseParsed.data;
}

async function markNotificationAsRead(
  client: Client,
  notificationId: string,
): Promise<ApiResult<{ success: boolean }>> {
  const response = await client(`/notifications/${notificationId}/read`, {
    method: "POST",
  });
  return responseMapper(response);
}

async function markNotificationAsUnread(
  client: Client,
  notificationId: string,
): Promise<ApiResult<{ success: boolean }>> {
  const response = await client(`/notifications/${notificationId}/unread`, {
    method: "POST",
  });
  return responseMapper(response);
}

async function markAllNotificationsAsRead(
  client: Client,
  params?: NotificationListParams,
): Promise<ApiResult<BulkUpdateResponse>> {
  const response = await client(`/notifications/mark-all-read${toQueryString(params)}`, {
    method: "POST",
  });
  return responseMapper(response);
}

async function archiveAllReadNotifications(
  client: Client,
  params?: NotificationListParams,
): Promise<ApiResult<BulkUpdateResponse>> {
  const response = await client(`/notifications/archive-all-read${toQueryString(params)}`, {
    method: "POST",
  });
  return responseMapper(response);
}

async function archiveNotification(
  client: Client,
  notificationId: string,
): Promise<ApiResult<{ success: boolean }>> {
  const response = await client(`/notifications/${notificationId}/archive`, {
    method: "POST",
  });
  return responseMapper(response);
}

async function starNotification(
  client: Client,
  notificationId: string,
): Promise<ApiResult<{ success: boolean; is_starred: boolean }>> {
  const response = await client(`/notifications/${notificationId}/star`, {
    method: "POST",
  });
  return responseMapper(response);
}

export interface UseNotificationsOptions extends NotificationListParams {
  onNotification?: (notification: NotificationMessage) => void;
}

export function useNotifications(
  params?: UseNotificationsOptions,
): UseNotificationsReturnType {
  const { client, loading: clientLoading } = useClient();
  const {
    data: pages,
    error,
    mutate: refetch,
    isLoading: notificationLoading,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite<NotificationListResponse>(
    (index, previousPageData) => {
      if (clientLoading) return null;
      if (index > 0 && (!previousPageData || !previousPageData.has_more)) return null;

      const cursor = index === 0 ? undefined : previousPageData?.notifications[previousPageData.notifications.length - 1]?.id;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { onNotification, ...queryParams } = params || {};
      return ["wacht-notifications", { ...queryParams, cursor }];
    },
    ([, keyParams]) => {
      return fetchNotifications(client, keyParams as NotificationListParams);
    },
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateFirstPage: true,
    },
  );

  const notifications = useMemo(() => {
    return pages ? pages.flatMap((page) => page.notifications) : [];
  }, [pages]);

  const hasMore = pages ? pages[pages.length - 1]?.has_more : false;

  useNotificationStream({
    enabled: !clientLoading && !!pages,
    onNotification: useCallback(
      (notification: NotificationMessage) => {
        refetch(async (current) => {
          if (!current || current.length === 0) return current;

          const exists = current.some((page) =>
            page.notifications.some((n) => n.id === notification.id.toString())
          );
          if (exists) return current;

          params?.onNotification?.(notification);

          // Prepend to the first page
          const firstPage = current[0];
          const newFirstPage = {
            ...firstPage,
            notifications: [
              {
                id: notification.id.toString(),
                user_id: notification.user_id.toString(),
                deployment_id: notification.deployment_id.toString(),
                title: notification.title,
                body: notification.body,
                severity: notification.severity,
                ctas: notification.ctas,
                is_read: false,
                is_archived: false,
                created_at: notification.created_at,
                updated_at: notification.created_at,
              } as Notification,
              ...firstPage.notifications,
            ],
          };

          return [newFirstPage, ...current.slice(1)];
        }, false);
      },
      [refetch, params],
    ),
    onError: useCallback(() => { }, []),
  });

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (clientLoading) return;

      await refetch(async (current) => {
        if (!current) return current;
        return current.map((page) => ({
          ...page,
          notifications: page.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n,
          ),
        }));
      }, false);

      await markNotificationAsRead(client, notificationId);

      await refetch();
    },
    [client, clientLoading, refetch],
  );

  const markAsUnread = useCallback(
    async (notificationId: string) => {
      if (clientLoading) return;

      await refetch(async (current) => {
        if (!current) return current;
        return current.map((page) => ({
          ...page,
          notifications: page.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: false } : n,
          ),
        }));
      }, false);

      await markNotificationAsUnread(client, notificationId);

      await refetch();
    },
    [client, clientLoading, refetch],
  );

  const markAllAsRead = useCallback(async () => {
    if (clientLoading) return;

    await refetch(async (current) => {
      if (!current) return current;
      return current.map((page) => ({
        ...page,
        notifications: page.notifications.map((n) => ({
          ...n,
          is_read: true,
        })),
      }));
    }, false);

    await markAllNotificationsAsRead(client, params);

    await refetch();
  }, [client, params, refetch, clientLoading]);

  const archiveAllRead = useCallback(async () => {
    if (clientLoading) return;

    await refetch(async (current) => {
      if (!current) return current;
      return current.map((page) => ({
        ...page,
        notifications: page.notifications.filter((n) => !n.is_read),
      }));
    }, false);

    await archiveAllReadNotifications(client, params);

    await refetch();
  }, [client, params, clientLoading, refetch]);

  const archiveNotificationCallback = useCallback(
    async (notificationId: string) => {
      if (clientLoading) return;

      await refetch(async (current) => {
        if (!current) return current;
        return current.map((page) => ({
          ...page,
          notifications: params?.is_archived !== undefined
            ? page.notifications.filter((n) => n.id !== notificationId)
            : page.notifications.map((n) =>
              n.id === notificationId ? { ...n, is_archived: !n.is_archived } : n
            ),
        }));
      }, false);

      await archiveNotification(client, notificationId);

      await refetch();
    },
    [client, clientLoading, refetch, params?.is_archived],
  );

  const starNotificationCallback = useCallback(
    async (notificationId: string) => {
      if (clientLoading) return;

      await refetch(async (current) => {
        if (!current) return current;
        return current.map((page) => ({
          ...page,
          notifications: page.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_starred: !n.is_starred } : n,
          ),
        }));
      }, false);

      await starNotification(client, notificationId);

      await refetch();
    },
    [client, clientLoading, refetch],
  );

  const loadMore = useCallback(async () => {
    if (isValidating || !hasMore) return;
    await setSize(size + 1);
  }, [isValidating, hasMore, setSize, size]);

  const refetchWrapper = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const isLoading = clientLoading || notificationLoading || (size > 0 && pages && typeof pages[size - 1] === "undefined");

  if (!pages || isLoading) {
    return {
      loading: true,
      notifications: notifications,
      hasMore: hasMore,
      markAsRead: undefined as never,
      markAllAsRead: undefined as never,
      archiveAllRead: undefined as never,
      archiveNotification: undefined as never,
      starNotification: undefined as never,
      markAsUnread: undefined as never,
      error,
      refetch: refetchWrapper,
      loadMore,
    } as const;
  }

  return {
    loading: false,
    error: error,
    notifications: notifications,
    hasMore: hasMore,
    markAsRead,
    markAllAsRead,
    archiveAllRead,
    archiveNotification: archiveNotificationCallback,
    starNotification: starNotificationCallback,
    markAsUnread,
    refetch: refetchWrapper,
    loadMore,
  } as const;
}

async function fetchScopeUnread(client: Client, params?: NotificationListParams): Promise<ScopeUnreadResponse> {
  const url = `/notifications/scope-unread${toQueryString(params)}`;

  const response = await client(url, {
    method: "GET",
  });
  const responseParsed = await responseMapper<ScopeUnreadResponse>(response);
  return responseParsed.data;
}

type UseScopeUnreadReturnType =
  | {
    loading: true;
    count: number;
    error: Error | null;
    refetch: () => Promise<void>;
  }
  | {
    loading: false;
    count: number;
    error: Error | null;
    refetch: () => Promise<void>;
  };

export function useScopeUnread(params?: NotificationListParams): UseScopeUnreadReturnType {
  const { client, loading: clientLoading } = useClient();

  const {
    data,
    error,
    mutate: refetch,
  } = useSWR(
    !clientLoading ? ["wacht-notifications-unread", params] : null,
    ([, keyParams]) => fetchScopeUnread(client, keyParams),
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const refetchWrapper = async () => {
    await refetch();
  };

  if (!data || clientLoading) {
    return {
      loading: true,
      count: 0,
      error,
      refetch: refetchWrapper,
    } as const;
  }

  return {
    loading: false,
    count: data.count,
    error,
    refetch: refetchWrapper,
  } as const;
}
