import { useEffect, useRef, useCallback, useState } from 'react';
import { useSession } from './use-session';
import { useDeployment } from './use-deployment';
import { getStoredDevSession } from '@/utils/dev-session';

export interface NotificationMessage {
  id: number;
  user_id: number;
  deployment_id: number;
  title: string;
  body: string;
  severity: string;
  ctas?: { label: string; payload: any }[];
  created_at: string;
}

interface WebSocketMessage {
  type: 'connected' | 'notification' | 'error';
  data?: NotificationMessage;
  message?: string;
  error?: string;
}

export interface UseNotificationStreamOptions {
  enabled?: boolean;
  channels?: string[];
  organizationIds?: number[];
  workspaceIds?: number[];
  onNotification?: (notification: NotificationMessage) => void;
  onError?: (error: string) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export function useNotificationStream({
  enabled = true,
  channels,
  organizationIds,
  workspaceIds,
  onNotification,
  onError,
  reconnectDelay = 1000,
  maxReconnectAttempts = 5,
}: UseNotificationStreamOptions = {}) {
  const { session, loading: sessionLoading } = useSession();
  const { deployment, loading: deploymentLoading } = useDeployment();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to prevent recreating connect function
  const onNotificationRef = useRef(onNotification);
  const onErrorRef = useRef(onError);
  const channelsRef = useRef(channels);
  const organizationIdsRef = useRef(organizationIds);
  const workspaceIdsRef = useRef(workspaceIds);
  const reconnectDelayRef = useRef(reconnectDelay);
  const maxReconnectAttemptsRef = useRef(maxReconnectAttempts);

  // Update refs when values change
  onNotificationRef.current = onNotification;
  onErrorRef.current = onError;
  channelsRef.current = channels;
  organizationIdsRef.current = organizationIds;
  workspaceIdsRef.current = workspaceIds;
  reconnectDelayRef.current = reconnectDelay;
  maxReconnectAttemptsRef.current = maxReconnectAttempts;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!enabled || sessionLoading || deploymentLoading || !session || !deployment) {
      return;
    }

    // Clean up any existing connection
    cleanup();

    // Parse the backend host URL and construct WebSocket URL
    const backendUrl = new URL(deployment.backend_host);
    const wsProtocol = backendUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = new URL(`/realtime/notifications`, `${wsProtocol}//${backendUrl.host}`);

    // Add session token for development environments (like frontend API)
    if (deployment.mode === "staging") {
      const devSession = getStoredDevSession();
      if (devSession) {
        wsUrl.searchParams.set('__dev_session__', devSession);
      }
    }

    // Add channel parameters if provided
    if (channelsRef.current && channelsRef.current.length > 0) {
      channelsRef.current.forEach(channel => wsUrl.searchParams.append('channels', channel));
    }
    if (organizationIdsRef.current && organizationIdsRef.current.length > 0) {
      organizationIdsRef.current.forEach(id => wsUrl.searchParams.append('organization_ids', id.toString()));
    }
    if (workspaceIdsRef.current && workspaceIdsRef.current.length > 0) {
      workspaceIdsRef.current.forEach(id => wsUrl.searchParams.append('workspace_ids', id.toString()));
    }

    try {
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        // Notification stream connected
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Set up ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'notification' && message.data) {
            onNotificationRef.current?.(message.data);
          } else if (message.type === 'error') {
            const error = message.error || 'Unknown error occurred';
            setConnectionError(error);
            onErrorRef.current?.(error);
          } else if (message.type === 'connected') {
            // Notification stream ready
          }
        } catch (err) {
          // Failed to parse notification message
        }
      };

      ws.onerror = () => {
        // WebSocket error occurred
        setConnectionError('Connection error occurred');
        onErrorRef.current?.('Connection error occurred');
      };

      ws.onclose = (event) => {
        // Notification stream disconnected
        setIsConnected(false);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not manually closed
        if (enabled && event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttemptsRef.current) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelayRef.current * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff

          // Reconnecting to notification stream

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttemptsRef.current) {
          setConnectionError('Max reconnection attempts reached');
          onErrorRef.current?.('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      // Failed to create WebSocket connection
      setConnectionError('Failed to connect');
      onErrorRef.current?.('Failed to connect');
    }
  }, [enabled, sessionLoading, deploymentLoading, session, deployment, cleanup]);

  useEffect(() => {
    connect();

    return () => {
      cleanup();
    };
  }, [connect, cleanup]);

  // Reconnect when channel parameters change
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Only reconnect if we're currently connected and parameters changed
      connect();
    }
  }, [channels, organizationIds, workspaceIds, connect]);

  const disconnect = useCallback(() => {
    cleanup();
    setIsConnected(false);
  }, [cleanup]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return {
    isConnected,
    connectionError,
    disconnect,
    reconnect,
  };
}
