import { useState, useEffect } from "react";
import styled from "styled-components";
import { DefaultStylesProvider } from "../utility/root";
import { AgentConversation } from "./agent-conversation";
import { ContextHistory } from "./context-history";
import {
  useContextManager,
  ExecutionContext,
} from "../../hooks/use-context-manager";

interface ContextManagerProps {
  agentName: string;
  token: string;
  platformAdapter?: {
    onPlatformEvent?: (eventName: string, eventData: unknown) => void;
    onPlatformFunction?: (
      functionName: string,
      parameters: unknown,
      executionId: string,
    ) => Promise<unknown>;
  };
  onContextCreated?: (context: ExecutionContext) => void;
  onError?: (error: string) => void;
  theme?: any;
  embedded?: boolean; // Whether component is embedded in a modal/popup
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
  overflow: auto;
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
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.8;
    cursor: not-allowed;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.8;
    }
    50% {
      opacity: 0.6;
    }
  }
`;

const LoadingDots = styled.span`
  &::after {
    content: '.';
    animation: dots 1.5s steps(3, end) infinite;
  }
  
  @keyframes dots {
    0%, 20% {
      content: '.';
    }
    40% {
      content: '..';
    }
    60%, 100% {
      content: '...';
    }
  }
`;

const ConversationCard = styled.div`
  width: 100%;
  padding: var(--space-md);
  background: var(--color-surface, var(--color-background));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;

  &:hover {
    background: var(--color-surface-hover, var(--color-background-hover));
    border-color: var(--color-border-hover, var(--color-border));
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

const ConversationCardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RecentConversations = styled.div`
  width: 100%;
  max-width: 320px;
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--color-border);
`;

const RecentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
`;

const RecentTitle = styled.h3`
  font-size: var(--font-xs);
  font-weight: 400;
  color: var(--color-muted);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const HistoryLink = styled.button`
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-xs);
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const ConversationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

export function ContextManager({
  agentName,
  token,
  platformAdapter,
  onContextCreated,
  onError,
  theme,
}: ContextManagerProps) {
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedContext, setSelectedContext] =
    useState<ExecutionContext | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { contexts, error, createContext } = useContextManager(token);

  useEffect(() => {
    if (error) {
      onError?.(error.message);
    }
  }, [error, onError]);

  const handleStartNewConversation = async () => {
    try {
      setCreateLoading(true);
      const title = `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      const newContext = await createContext({ title });
      setSelectedContext(newContext);
      onContextCreated?.(newContext);
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : "Failed to create conversation",
      );
    } finally {
      setCreateLoading(false);
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
      return "Just now";
    } catch {
      return "";
    }
  };

  // If showing history view
  if (showHistory) {
    return (
      <DefaultStylesProvider theme={theme} style={{ height: "100%" }}>
        <ContextHistory
          token={token}
          onSelectContext={(context) => {
            setSelectedContext(context);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
          theme={theme}
        />
      </DefaultStylesProvider>
    );
  }

  // If a context is selected, show the conversation view
  if (selectedContext) {
    return (
      <DefaultStylesProvider theme={theme} style={{ height: "100%" }}>
        <div
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <AgentConversation
            contextId={selectedContext.id}
            agentName={agentName}
            token={token}
            platformAdapter={platformAdapter}
            autoConnect={true}
            showEmptyState={true}
            theme={theme}
          />
        </div>
      </DefaultStylesProvider>
    );
  }

  // Otherwise show the home screen
  return (
    <DefaultStylesProvider theme={theme} style={{ height: "100%" }}>
      <Container>
        <HomeScreen>
          <WelcomeIcon>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </WelcomeIcon>

          <WelcomeTitle>Hi there! 👋</WelcomeTitle>
          <WelcomeSubtitle>How can I help you today?</WelcomeSubtitle>

          <StartButton
            onClick={handleStartNewConversation}
            disabled={createLoading}
          >
            {createLoading ? (
              <>
                Starting<LoadingDots />
              </>
            ) : (
              "Start a conversation"
            )}
          </StartButton>

          {contexts.length > 0 && (
            <RecentConversations>
              <RecentHeader>
                <RecentTitle>Recent Chats</RecentTitle>
                <HistoryLink onClick={() => setShowHistory(true)}>
                  History →
                </HistoryLink>
              </RecentHeader>

              <ConversationList>
                {contexts.slice(0, 2).map((context: ExecutionContext) => (
                  <ConversationCard
                    key={context.id}
                    onClick={() => setSelectedContext(context)}
                  >
                    <ConversationCardContent>
                      <ConversationCardTitle>
                        {context.title}
                      </ConversationCardTitle>
                      <ConversationCardMeta>
                        <span>{formatTime(context.last_activity_at)}</span>
                        {context.status === "running" && <span>• Active</span>}
                      </ConversationCardMeta>
                    </ConversationCardContent>
                  </ConversationCard>
                ))}
              </ConversationList>
            </RecentConversations>
          )}
        </HomeScreen>
      </Container>
    </DefaultStylesProvider>
  );
}
