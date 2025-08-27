import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DefaultStylesProvider } from '../utility/root';
import { AgentConversation } from '../agent-conversation/agent-conversation';

export interface ExecutionContext {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'waiting_for_input' | 'interrupted' | 'completed' | 'failed';
  last_activity_at: string;
  context_group?: string;
  created_at: string;
}

export interface CreateContextRequest {
  title: string;
  context_group?: string;
}

export interface ListContextsOptions {
  limit?: number;
  offset?: number;
  status?: string;
  context_group?: string;
  search?: string;
}

export interface ListContextsResponse {
  data: ExecutionContext[];
  has_more: boolean;
}

// API interface that consuming applications must implement
export interface ContextManagerAPI {
  // List execution contexts with pagination and filtering
  listContexts: (options?: ListContextsOptions) => Promise<ListContextsResponse>;
  
  // Create a new execution context
  createContext: (request: CreateContextRequest) => Promise<ExecutionContext>;
  
  // Delete a context (optional)
  deleteContext?: (id: string) => Promise<void>;
}

interface ContextManagerProps {
  // Required API implementation provided by consuming application
  api: ContextManagerAPI;
  
  // Agent configuration for WebSocket connection
  agentName: string;
  onTokenNeeded: () => Promise<string>;
  platformAdapter?: {
    onPlatformEvent?: (eventName: string, eventData: unknown) => void;
    onPlatformFunction?: (
      functionName: string,
      parameters: unknown,
      executionId: string,
    ) => Promise<unknown>;
  };
  
  // Optional callbacks
  onContextCreated?: (context: ExecutionContext) => void;
  onError?: (error: string) => void;
  theme?: any;
}

// Styled components
const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
`;

const HomeScreen = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
`;

const WelcomeIcon = styled.div`
  width: 56px;
  height: 56px;
  margin-bottom: var(--space-lg);
  
  svg {
    width: 100%;
    height: 100%;
    color: var(--color-secondary-text);
    opacity: 0.6;
  }
`;

const WelcomeTitle = styled.h2`
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 var(--space-sm) 0;
  text-align: center;
`;

const WelcomeSubtitle = styled.p`
  font-size: var(--font-sm);
  color: var(--color-secondary-text);
  margin: 0 0 var(--space-xl) 0;
  text-align: center;
`;

const StartButton = styled.button`
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-xl);
  font-size: var(--font-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RecentConversations = styled.div`
  width: 100%;
  max-width: 320px;
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--color-border);
`;

const RecentTitle = styled.h3`
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--color-muted);
  margin: 0 0 var(--space-md) 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
`;

const ConversationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const ConversationCard = styled.div`
  width: 100%;
  padding: var(--space-md);
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  display: flex;
  flex-direction: column;
  
  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-border-hover);
    transform: translateX(2px);
  }
  
  &:hover .delete-button {
    opacity: 1;
  }
`;

const ConversationCardTitle = styled.div`
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: var(--space-2xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConversationCardMeta = styled.div`
  font-size: var(--font-2xs);
  color: var(--color-secondary-text);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: var(--font-sm);
  color: var(--color-secondary-text);
`;

const DeleteButton = styled.button`
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 24px;
  height: 24px;
  border: none;
  background: var(--color-background);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
  cursor: pointer;
  color: var(--color-secondary-text);
  
  &:hover {
    background: var(--color-background-hover);
    color: var(--color-error);
  }
`;

const ConversationCardContent = styled.div`
  flex: 1;
  min-width: 0;
  padding-right: var(--space-md);
`;

export function ContextManager({ 
  api,
  agentName,
  onTokenNeeded,
  platformAdapter,
  onContextCreated,
  onError,
  theme
}: ContextManagerProps) {
  const [contexts, setContexts] = useState<ExecutionContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ExecutionContext | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Load contexts on mount
  useEffect(() => {
    loadContexts();
  }, []);

  const loadContexts = async () => {
    try {
      setLoading(true);
      const response = await api.listContexts();
      setContexts(response.data);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewConversation = async () => {
    try {
      setCreateLoading(true);
      const title = `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      const newContext = await api.createContext({ title });
      setContexts(prev => [newContext, ...prev]);
      setSelectedContext(newContext);
      onContextCreated?.(newContext);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteContext = async (contextId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!api.deleteContext) {
      onError?.('Delete functionality not implemented');
      return;
    }
    
    try {
      setDeletingIds(prev => new Set(prev).add(contextId));
      await api.deleteContext(contextId);
      setContexts(prev => prev.filter(ctx => ctx.id !== contextId));
      
      // If the deleted context was selected, clear selection
      if (selectedContext?.id === contextId) {
        setSelectedContext(null);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to delete conversation');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(contextId);
        return newSet;
      });
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    } catch {
      return '';
    }
  };

  // If a context is selected, show the conversation view
  if (selectedContext) {
    return (
      <DefaultStylesProvider theme={theme} style={{ height: '100%' }}>
        <Container>
          <AgentConversation
            contextId={selectedContext.id}
            agentName={agentName}
            onTokenNeeded={onTokenNeeded}
            platformAdapter={platformAdapter}
            autoConnect={true}
            showEmptyState={true}
            theme={theme}
          />
        </Container>
      </DefaultStylesProvider>
    );
  }

  // Otherwise show the home screen
  return (
    <DefaultStylesProvider theme={theme} style={{ height: '100%' }}>
      <Container>
        {loading ? (
          <LoadingState>Loading...</LoadingState>
        ) : (
          <HomeScreen>
            <WelcomeIcon>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </WelcomeIcon>
            
            <WelcomeTitle>Hi there! 👋</WelcomeTitle>
            <WelcomeSubtitle>How can I help you today?</WelcomeSubtitle>
            
            <StartButton 
              onClick={handleStartNewConversation}
              disabled={createLoading}
            >
              {createLoading ? 'Starting...' : 'Start a conversation'}
            </StartButton>
            
            {contexts.length > 0 && (
              <RecentConversations>
                <RecentTitle>Recent conversations</RecentTitle>
                <ConversationList>
                  {contexts.slice(0, 3).map((context) => (
                    <ConversationCard
                      key={context.id}
                      onClick={() => setSelectedContext(context)}
                    >
                      <ConversationCardContent>
                        <ConversationCardTitle>{context.title}</ConversationCardTitle>
                        <ConversationCardMeta>
                          <span>{formatTime(context.last_activity_at)}</span>
                          {context.status === 'running' && <span>• Active</span>}
                        </ConversationCardMeta>
                      </ConversationCardContent>
                      
                      {api.deleteContext && (
                        <DeleteButton
                          className="delete-button"
                          onClick={(e) => handleDeleteContext(context.id, e)}
                          disabled={deletingIds.has(context.id)}
                          title="Delete conversation"
                        >
                          {deletingIds.has(context.id) ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="12" r="1">
                                <animate attributeName="opacity" dur="1s" values="0;1;0" repeatCount="indefinite" begin="0s" />
                              </circle>
                              <circle cx="12" cy="12" r="1">
                                <animate attributeName="opacity" dur="1s" values="0;1;0" repeatCount="indefinite" begin="0.33s" />
                              </circle>
                              <circle cx="12" cy="12" r="1">
                                <animate attributeName="opacity" dur="1s" values="0;1;0" repeatCount="indefinite" begin="0.66s" />
                              </circle>
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                            </svg>
                          )}
                        </DeleteButton>
                      )}
                    </ConversationCard>
                  ))}
                </ConversationList>
              </RecentConversations>
            )}
          </HomeScreen>
        )}
      </Container>
    </DefaultStylesProvider>
  );
}