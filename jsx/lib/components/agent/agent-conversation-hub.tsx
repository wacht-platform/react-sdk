import { useState } from "react";
import styled from "styled-components";
import { DefaultStylesProvider } from "../utility/root";
import { AgentConversation } from "./agent-conversation";
import { AgentConversationHistory } from "./agent-conversation-history";
import { useAgentConversationContext } from "../../context/agent-conversation-provider";

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
  font-weight: 400;
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
    0%,
    100% {
      opacity: 0.8;
    }
    50% {
      opacity: 0.6;
    }
  }
`;

const LoadingDots = styled.span`
  &::after {
    content: ".";
    animation: dots 1.5s steps(3, end) infinite;
  }

  @keyframes dots {
    0%,
    20% {
      content: ".";
    }
    40% {
      content: "..";
    }
    60%,
    100% {
      content: "...";
    }
  }
`;

const SessionCard = styled.div`
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

const SessionCardTitle = styled.div`
  font-size: var(--font-sm);
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: var(--space-2xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SessionCardMeta = styled.div`
  font-size: var(--font-2xs);
  color: var(--color-secondary-text);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const SessionCardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RecentSessions = styled.div`
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

const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

export function AgentConversationHub() {
  const [createLoading, setCreateLoading] = useState(false);

  const {
    sessions,
    selectedSession,
    showHistory,
    selectSession,
    createSession,
    setShowHistory,
  } = useAgentConversationContext();

  const handleStartNewConversation = async () => {
    try {
      setCreateLoading(true);
      await createSession();
    } finally {
      setCreateLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
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

  if (showHistory) {
    return <AgentConversationHistory showBackButton={true} />;
  }

  if (selectedSession) {
    return <AgentConversation showBackButton={true} />;
  }

  return (
    <DefaultStylesProvider style={{ height: "100%", width: "100%" }}>
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
                Starting
                <LoadingDots />
              </>
            ) : (
              "Start a conversation"
            )}
          </StartButton>

          {sessions.length > 0 && (
            <RecentSessions>
              <RecentHeader>
                <RecentTitle>Recent Chats</RecentTitle>
                <HistoryLink onClick={() => setShowHistory(true)}>
                  View All →
                </HistoryLink>
              </RecentHeader>

              <SessionList>
                {sessions.slice(0, 2).map((session) => (
                  <SessionCard
                    key={session.id}
                    onClick={() => selectSession(session)}
                  >
                    <SessionCardContent>
                      <SessionCardTitle>{session.title}</SessionCardTitle>
                      <SessionCardMeta>
                        <span>{formatTimeAgo(session.last_activity_at)}</span>
                        {session.status === "running" && <span>• Active</span>}
                      </SessionCardMeta>
                    </SessionCardContent>
                  </SessionCard>
                ))}
              </SessionList>
            </RecentSessions>
          )}
        </HomeScreen>
      </Container>
    </DefaultStylesProvider>
  );
}
