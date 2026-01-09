import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ConversationSession, useConversationSessions } from '../hooks/use-conversation-sessions';
import { useDeployment } from '../hooks/use-deployment';

interface PlatformAdapter {
  onPlatformEvent?: (eventName: string, eventData: unknown) => void;
  onPlatformFunction?: (
    functionName: string,
    parameters: unknown,
    executionId: string,
  ) => Promise<unknown>;
}

interface AgentConversationContextValue {
  agentName: string;
  token: string;
  platformAdapter?: PlatformAdapter;
  sessions: ConversationSession[];
  selectedSession: ConversationSession | null;
  loadingSessions: boolean;
  sessionError: Error | null;
  selectSession: (session: ConversationSession | null) => void;
  createSession: (title?: string) => Promise<ConversationSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  getFileUrl: (relativePath: string) => string;
  onSessionCreated?: (session: ConversationSession) => void;
  onSessionDeleted?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

const AgentConversationContext = createContext<AgentConversationContextValue | undefined>(undefined);

export function useAgentConversationContext() {
  const context = useContext(AgentConversationContext);
  if (!context) {
    throw new Error('useAgentConversationContext must be used within AgentConversationProvider');
  }
  return context;
}

interface AgentConversationProviderProps {
  children: ReactNode;
  agentName: string;
  token: string;
  platformAdapter?: PlatformAdapter;
  defaultSessionId?: string;
  onSessionCreated?: (session: ConversationSession) => void;
  onSessionDeleted?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

export function AgentConversationProvider({
  children,
  agentName,
  token,
  platformAdapter,
  defaultSessionId,
  onSessionCreated,
  onSessionDeleted,
  onError,
}: AgentConversationProviderProps) {
  const { deployment } = useDeployment();
  const [selectedSession, setSelectedSession] = useState<ConversationSession | null>(
    defaultSessionId ? {
      id: defaultSessionId,
      title: 'Conversation',
      status: 'idle',
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    } : null
  );
  const [showHistory, setShowHistory] = useState(false);

  const {
    sessions,
    loading: loadingSessions,
    error: sessionError,
    createSession: createSessionApi,
    deleteSession: deleteSessionApi,
    refetch: refreshSessions,
  } = useConversationSessions(token);

  // Update session details when actual sessions are loaded
  useEffect(() => {
    if (defaultSessionId && sessions.length > 0) {
      const actualSession = sessions.find(s => s.id === defaultSessionId);
      if (actualSession) {
        setSelectedSession(actualSession);
      }
    }
  }, [defaultSessionId, sessions]);

  const selectSession = useCallback((session: ConversationSession | null) => {
    setSelectedSession(session);
    setShowHistory(false);
  }, []);

  const createSession = useCallback(async (title?: string) => {
    try {
      const sessionTitle = title || `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      const newSession = await createSessionApi({ title: sessionTitle });

      setSelectedSession(newSession);
      onSessionCreated?.(newSession);

      return newSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      onError?.(errorMessage);
      throw error;
    }
  }, [createSessionApi, onSessionCreated, onError]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await deleteSessionApi(sessionId);

      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }

      onSessionDeleted?.(sessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
      onError?.(errorMessage);
      throw error;
    }
  }, [deleteSessionApi, selectedSession, onSessionDeleted, onError]);

  const getFileUrl = useCallback((relativePath: string): string => {
    if (!selectedSession || !deployment?.backend_host) {
      return relativePath;
    }
    if (relativePath.startsWith('/uploads/')) {
      const filename = relativePath.replace('/uploads/', '');
      return `${deployment.backend_host}/api/agent/contexts/${selectedSession.id}/files/${filename}?token=${encodeURIComponent(token)}`;
    }
    return relativePath;
  }, [selectedSession, deployment?.backend_host, token]);

  const value: AgentConversationContextValue = {
    agentName,
    token,
    platformAdapter,
    sessions,
    selectedSession,
    loadingSessions,
    sessionError,
    selectSession,
    createSession,
    deleteSession,
    refreshSessions,
    showHistory,
    setShowHistory,
    getFileUrl,
    onSessionCreated,
    onSessionDeleted,
    onError,
  };

  return (
    <AgentConversationContext.Provider value={value}>
      {children}
    </AgentConversationContext.Provider>
  );
}