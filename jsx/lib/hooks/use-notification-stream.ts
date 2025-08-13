import { useEffect, useRef, useCallback, useState } from 'react';
import { useSession } from './use-session';
import { useDeployment } from './use-deployment';

export interface NotificationMessage {
  id: number;
  user_id: number;
  deployment_id: number;
  title: string;
  body: string;
  severity: string;
  action_url?: string;
  action_label?: string;
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
  onNotification?: (notification: NotificationMessage) => void;
  onError?: (error: string) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export function useNotificationStream({
  enabled = true,
  onNotification,
  onError,
  reconnectDelay = 1000,
  maxReconnectAttempts = 5,
}: UseNotificationStreamOptions = {}) {
  const { session, getToken, loading: sessionLoading } = useSession();
  const { deployment, loading: deploymentLoading } = useDeployment();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // Get token if we don't have one
    if (!token) {
      try {
        const newToken = await getToken();
        setToken(newToken);
      } catch (error) {
        console.error('Failed to get token:', error);
        setConnectionError('Failed to authenticate');
        onError?.('Failed to authenticate');
        return;
      }
    }

    // Clean up any existing connection
    cleanup();

    // Parse the backend host URL and construct WebSocket URL (same as agent conversation)
    const backendUrl = new URL(deployment.backend_host);
    const wsUrl = new URL(`/realtime/notifications`, `wss://${backendUrl.host}`);
    wsUrl.searchParams.set('token', token || await getToken());
    wsUrl.searchParams.set('host', window.location.hostname);

    try {
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Notification stream connected');
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
            onNotification?.(message.data);
          } else if (message.type === 'error') {
            const error = message.error || 'Unknown error occurred';
            setConnectionError(error);
            onError?.(error);
          } else if (message.type === 'connected') {
            console.log('Notification stream ready:', message.message);
          }
        } catch (err) {
          console.error('Failed to parse notification message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
        onError?.('Connection error occurred');
      };

      ws.onclose = (event) => {
        console.log('Notification stream disconnected', event.code, event.reason);
        setIsConnected(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not manually closed
        if (enabled && event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Max reconnection attempts reached');
          onError?.('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to connect');
      onError?.('Failed to connect');
    }
  }, [enabled, sessionLoading, deploymentLoading, session, deployment, token, getToken, onNotification, onError, reconnectDelay, maxReconnectAttempts, cleanup]);

  useEffect(() => {
    connect();
    
    return () => {
      cleanup();
    };
  }, [connect, cleanup]);

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