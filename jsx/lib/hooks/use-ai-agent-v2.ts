import { useCallback, useEffect, useState, useRef } from 'react';
import { aiAgentManager, AgentSession } from '../services/ai-agent-manager';
import { useDeployment } from './use-deployment';
import { CONNECTION_STATES, DEFAULT_OPTIONS } from '../constants/ai-agent';

export interface UseAIAgentOptions {
  contextId: string;
  agentName: string;
  autoConnect?: boolean;
  platformFunctions?: Record<string, (params: any) => Promise<any> | any>;
}

export function useAIAgent(options: UseAIAgentOptions) {
  const {
    contextId,
    agentName,
    autoConnect = DEFAULT_OPTIONS.AUTO_CONNECT,
    platformFunctions = {},
  } = options;

  const { deployment } = useDeployment();
  const sessionKeyRef = useRef<string | null>(null);
  const [session, setSession] = useState<AgentSession | null>(null);

  // Get or create session key
  useEffect(() => {
    const sessionKey = aiAgentManager.createSession(contextId, agentName);
    sessionKeyRef.current = sessionKey;

    // Register platform functions
    Object.entries(platformFunctions).forEach(([name, fn]) => {
      aiAgentManager.registerPlatformFunction(name, fn);
    });

    // Subscribe to session updates
    const handleUpdate = (updatedSession: AgentSession) => {
      setSession({ ...updatedSession });
    };

    aiAgentManager.on(`session:${sessionKey}:update`, handleUpdate);

    // Get initial session state
    const initialSession = aiAgentManager.getSession(sessionKey);
    if (initialSession) {
      setSession({ ...initialSession });
    }

    return () => {
      // Cleanup
      aiAgentManager.off(`session:${sessionKey}:update`, handleUpdate);
      
      // Unregister platform functions
      Object.keys(platformFunctions).forEach(name => {
        aiAgentManager.unregisterPlatformFunction(name);
      });
    };
  }, [contextId, agentName]);

  // Update platform functions when they change
  useEffect(() => {
    Object.entries(platformFunctions).forEach(([name, fn]) => {
      aiAgentManager.registerPlatformFunction(name, fn);
    });

    return () => {
      Object.keys(platformFunctions).forEach(name => {
        aiAgentManager.unregisterPlatformFunction(name);
      });
    };
  }, [platformFunctions]);

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    // Hardcoded for testing
    const backend_host = 'localhost:3002';
    const protocol = backend_host.includes('localhost') ? 'ws' : 'wss';
    return `${protocol}://${backend_host}/agent`;
  }, [deployment]);

  // Connection management
  const connect = useCallback(() => {
    const wsUrl = getWebSocketUrl();
    if (!wsUrl || !sessionKeyRef.current) {
      console.error('Cannot connect: No WebSocket URL or session');
      return;
    }

    aiAgentManager.connect(sessionKeyRef.current, wsUrl);
  }, [getWebSocketUrl]);

  const disconnect = useCallback(() => {
    if (!sessionKeyRef.current) return;
    aiAgentManager.disconnect(sessionKeyRef.current);
  }, []);

  // Message actions
  const sendMessage = useCallback((content: string) => {
    if (!sessionKeyRef.current) return;
    aiAgentManager.sendMessage(sessionKeyRef.current, content);
  }, []);

  const clearMessages = useCallback(() => {
    if (!sessionKeyRef.current) return;
    aiAgentManager.clearSession(sessionKeyRef.current);
  }, []);

  // Event subscriptions
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (!sessionKeyRef.current) return () => {};
    
    const eventName = `session:${sessionKeyRef.current}:${event}`;
    aiAgentManager.on(eventName, callback);
    
    return () => {
      aiAgentManager.off(eventName, callback);
    };
  }, []);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && deployment) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, deployment, connect, disconnect]);

  // Computed values
  const messages = session?.messages || [];
  const connectionState = session?.connectionState || { status: CONNECTION_STATES.DISCONNECTED };
  const isAgentTyping = session?.isTyping || false;
  const isConnected = connectionState.status === CONNECTION_STATES.CONNECTED;
  const isConnecting = connectionState.status === CONNECTION_STATES.CONNECTING;
  const hasError = connectionState.status === CONNECTION_STATES.ERROR;

  return {
    // State
    messages,
    connectionState,
    isAgentTyping,
    isConnected,
    isConnecting,
    hasError,

    // Actions
    connect,
    disconnect,
    sendMessage,
    clearMessages,

    // Events
    on,
  };
}